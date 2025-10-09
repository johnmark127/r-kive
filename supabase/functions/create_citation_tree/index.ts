
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const supabaseUrl = Deno.env.get("PROJECT_URL")!;
const supabaseKey = Deno.env.get("SERVICE_ROLE_KEY")!;

const SIMILARITY_THRESHOLD = 0.7; // Lower threshold for text matching

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    console.log("🚀 Edge Function Version: 2.0 - Client Text Support");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json();
    const { title, authors, year_published, abstract, category, file_url, uploaded_by, paper_id, retry, extracted_text } = body;

    if (!title || !authors || !year_published || !abstract || !file_url) {
      return new Response(JSON.stringify({ success: false, message: "Missing required fields." }), { status: 400, headers: corsHeaders });
    }

    let paper_id_to_use = paper_id;
    
    // If retry mode and paper_id provided, use existing paper
    if (retry && paper_id) {
      console.log(`Retry mode: Updating existing paper ${paper_id}`);
      
      // Update status to processing
      await supabase
        .from("research_papers")
        .update({
          citations_extracted: false,
          extraction_status: 'processing'
        })
        .eq("id", paper_id);
        
      paper_id_to_use = paper_id;
    } else {
      // 1. Insert the new paper first
      const { data: paper, error: insertError } = await supabase
        .from("research_papers")
        .insert([{
          title,
          authors,
          year_published,
          abstract,
          category,
          file_url,
          uploaded_by,
          abstract_embedding: null,
          citations_extracted: false,
          extraction_status: 'processing'
        }])
        .select()
        .single();

      if (insertError) {
        return new Response(JSON.stringify({ success: false, message: insertError.message }), { status: 500, headers: corsHeaders });
      }

      paper_id_to_use = paper.id;
    }
    let citation_count = 0;

    try {
      // 2. Get PDF text - use client-provided text if available, otherwise extract from PDF
      let pdfText = "";
      
      console.log(`Received extracted_text: ${extracted_text ? extracted_text.length + ' chars' : 'null/undefined'}`);
      if (extracted_text) {
        console.log(`First 100 chars of received text: ${extracted_text.substring(0, 100)}`);
      }
      
      if (extracted_text && extracted_text.length > 10) {  // Lowered threshold from 50 to 10
        console.log(`✓ Using client-extracted text (${extracted_text.length} characters)`);
        pdfText = extracted_text;
        console.log(`First 200 characters: ${pdfText.substring(0, 200)}`);
      } else {
        console.log(`⚠ Client text too short (${extracted_text?.length || 0} chars) or missing, falling back to server extraction`);
        // Fallback: Download and extract text from PDF
        console.log("Downloading PDF from:", file_url);
        const pdfResponse = await fetch(file_url);
        if (!pdfResponse.ok) {
          console.error("Failed to download PDF");
          return new Response(JSON.stringify({ 
            success: true, 
            paper_id: paper_id_to_use, 
            citation_count: 0,
            warning: "Paper uploaded but failed to download PDF for citation analysis."
          }), { status: 200, headers: corsHeaders });
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        pdfText = await extractTextFromPDF(pdfBuffer);
        console.log(`Extracted ${pdfText.length} characters from PDF`);
        console.log(`First 500 characters: ${pdfText.substring(0, 500)}`);
      }
      
      if (!pdfText || pdfText.length < 10) {  // Lowered from 50 to 10
        console.warn("PDF text extraction returned very little text");
        
        // Update status to failed
        await supabase
          .from("research_papers")
          .update({
            citations_extracted: false,
            citations_extracted_at: new Date().toISOString(),
            extraction_status: 'failed_no_text'
          })
          .eq("id", paper_id_to_use);
        
        return new Response(JSON.stringify({ 
          success: true, 
          paper_id: paper_id_to_use, 
          citation_count: 0,
          warning: "Paper uploaded but PDF text extraction failed. Citations cannot be detected."
        }), { status: 200, headers: corsHeaders });
      }

      // 3. Fetch all other papers
      const { data: otherPapers, error: fetchError } = await supabase
        .from("research_papers")
        .select("id, title, authors, year_published")
        .neq("id", paper_id_to_use);

      if (fetchError) {
        console.error("Failed to fetch other papers:", fetchError);
        return new Response(JSON.stringify({ success: true, paper_id: paper_id_to_use, citation_count: 0 }), { status: 200, headers: corsHeaders });
      }

      // 4. Search for citations in the PDF text
      console.log(`Checking against ${otherPapers.length} other papers...`);
      
      for (const other of otherPapers) {
        console.log(`Checking if cites: "${other.title}" by ${other.authors} (${other.year_published})`);
        
        if (isCitedInText(pdfText, other)) {
          // Insert citation (new paper cites other)
          const { error: citeError } = await supabase
            .from("citations")
            .insert([{ citing_paper_id: paper_id_to_use, cited_paper_id: other.id }]);
          
          if (!citeError) {
            citation_count++;
            console.log(`✓ CITATION FOUND: "${other.title}"`);
          } else {
            console.error(`Failed to insert citation:`, citeError);
          }
        } else {
          console.log(`✗ No citation found for: "${other.title}"`);
        }
      }

      // Update extraction status to completed
      await supabase
        .from("research_papers")
        .update({
          citations_extracted: true,
          citations_extracted_at: new Date().toISOString(),
          extraction_status: citation_count > 0 ? 'completed_with_citations' : 'completed_no_citations'
        })
        .eq("id", paper_id_to_use);

      return new Response(JSON.stringify({ 
        success: true, 
        paper_id: paper_id_to_use, 
        citation_count,
        message: citation_count > 0 
          ? `Paper uploaded with ${citation_count} citation(s) found.`
          : "Paper uploaded. No citations found in references."
      }), { status: 200, headers: corsHeaders });

    } catch (error) {
      console.error("Citation analysis error:", error);
      // Paper is already inserted, so return success
      return new Response(JSON.stringify({ 
        success: true, 
        paper_id: paper_id_to_use, 
        citation_count: 0,
        warning: "Paper uploaded but citation analysis failed."
      }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, paper_id, citation_count }), { status: 200, headers: corsHeaders });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Edge function error:", errorMessage);
    return new Response(JSON.stringify({ success: false, message: errorMessage }), { status: 500, headers: corsHeaders });
  }
});

// Helper: Extract text from PDF using external API service
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    
    // Use an external PDF to text API (pdf.co has a free tier)
    // Convert ArrayBuffer to base64
    const uint8Array = new Uint8Array(pdfBuffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));
    
    try {
      const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'demo' // Free demo key - replace with your own for production
        },
        body: JSON.stringify({
          url: `data:application/pdf;base64,${base64}`,
          inline: true,
          async: false
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.body && result.body.length > 50) {
          console.log(`✓ Extracted ${result.body.length} characters using pdf.co API`);
          console.log(`First 200 chars: ${result.body.substring(0, 200)}`);
          return result.body;
        }
      }
    } catch (apiError) {
      console.log('pdf.co API failed, trying fallback method:', apiError);
    }
    
    // Fallback: Basic extraction
    console.log('Using fallback extraction method...');
    let pdfText = '';
    
    // Convert to Latin-1 string
    for (let i = 0; i < uint8Array.length; i++) {
      pdfText += String.fromCharCode(uint8Array[i]);
    }
    
    console.log(`PDF converted to string, length: ${pdfText.length}`);
    
    let extractedText = '';
    const textPieces: string[] = [];
    
    // Method 1: Extract text from parentheses with Tj/TJ operators
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
    let match;
    while ((match = tjRegex.exec(pdfText)) !== null) {
      let text = match[1];
      
      // Check for UTF-16 BOM
      if (text.charCodeAt(0) === 0xFE && text.charCodeAt(1) === 0xFF) {
        let decoded = '';
        for (let i = 2; i < text.length; i += 2) {
          const charCode = (text.charCodeAt(i) << 8) | text.charCodeAt(i + 1);
          if (charCode > 0 && (charCode < 0xD800 || charCode > 0xDFFF)) {
            decoded += String.fromCharCode(charCode);
          }
        }
        text = decoded;
      } else {
        text = text
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\')
          .replace(/\\([()])/g, '$1')
          .trim();
      }
      
      const isMetadata = /^(CreationDate|ModDate|Producer|Creator|Title|Author|Subject)/.test(text);
      if (text.length > 2 && !isMetadata) {
        textPieces.push(text);
      }
    }
    
    // Method 2: If Method 1 didn't work, try ALL parentheses
    if (textPieces.length < 5) {
      console.log('Method 1 failed, trying all parentheses...');
      const allParenRegex = /\(([^)]+)\)/g;
      while ((match = allParenRegex.exec(pdfText)) !== null) {
        let text = match[1];
        
        if (text.charCodeAt(0) === 0xFE && text.charCodeAt(1) === 0xFF) {
          let decoded = '';
          for (let i = 2; i < text.length; i += 2) {
            const charCode = (text.charCodeAt(i) << 8) | text.charCodeAt(i + 1);
            if (charCode > 0 && (charCode < 0xD800 || charCode > 0xDFFF)) {
              decoded += String.fromCharCode(charCode);
            }
          }
          text = decoded;
        } else {
          text = text
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/\\\\/g, '\\')
            .replace(/\\([()])/g, '$1')
            .trim();
        }
        
        const isMetadata = /^(CreationDate|ModDate|Producer|Creator|Title|Author|Subject)/.test(text);
        if (text.length > 2 && !isMetadata) {
          textPieces.push(text);
        }
      }
    }
    
    extractedText = textPieces.join(' ');
    console.log(`Extracted ${extractedText.length} characters using fallback`);
    console.log(`First 200 chars: ${extractedText.substring(0, 200)}`);
    return extractedText;
    
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "";
  }
}

// Helper: Check if a paper is cited in the text
function isCitedInText(text: string, paper: { title: string; authors: string; year_published: number }): boolean {
  const normalizedText = text.toLowerCase();
  
  console.log(`\n=== Checking paper: "${paper.title}" ===`);
  
  // SUPER AGGRESSIVE normalization - remove ALL spaces for comparison
  const superNormalizedText = text.toLowerCase()
    .replace(/\s+/g, '')  // Remove ALL spaces
    .replace(/[-_]/g, ''); // Remove hyphens and underscores
  
  const superNormalizedTitle = paper.title.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '');
  
  console.log(`Searching for: "${superNormalizedTitle}" (${superNormalizedTitle.length} chars)`);
  console.log(`In text: "${superNormalizedText.substring(0, 100)}..." (${superNormalizedText.length} chars total)`);
  
  // Check for title match with aggressive space normalization
  if (superNormalizedText.includes(superNormalizedTitle)) {
    console.log(`✓ MATCH FOUND! Title match (space-normalized): "${paper.title}"`);
    return true;
  }
  
  console.log(`✗ No match found for: "${paper.title}"`);
  return false;
}

// Helper: Extract reference/bibliography section
function extractReferenceSection(text: string): string {
  const referenceHeaders = [
    'references',
    'bibliography',
    'works cited',
    'literature cited'
  ];

  const normalizedText = text.toLowerCase();
  
  for (const header of referenceHeaders) {
    const index = normalizedText.indexOf(header);
    if (index !== -1) {
      // Return text from references section onwards (or last 2000 chars)
      return text.substring(index, index + 2000);
    }
  }

  return "";
}
