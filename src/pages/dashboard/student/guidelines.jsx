import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardCheck,
  FileText,
  Calendar,
  BookOpen,
  Search,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Lightbulb,
} from "lucide-react"

const GuidelinesPage = () => {
  const guidelineStats = [
    {
      title: "Active Guidelines",
      value: "12",
      icon: ClipboardCheck,
      description: "Current research guidelines",
    },
    {
      title: "Research Templates",
      value: "8",
      icon: FileText,
      description: "Available document templates",
    },
    {
      title: "Upcoming Deadlines",
      value: "3",
      icon: Calendar,
      description: "Important dates this month",
    },
    {
      title: "Citation Formats",
      value: "5",
      icon: BookOpen,
      description: "Supported citation styles",
    },
  ]

  const researchProcess = [
    {
      step: "1",
      title: "Topic Selection",
      description: "Choose a relevant and current topic",
      guidelines: [
        "Choose a relevant and current topic",
        "Ensure the scope is manageable",
        "Consider available resources and time constraints",
        "Verify topic originality and significance",
      ],
      icon: Lightbulb,
      status: "essential",
    },
    {
      step: "2",
      title: "Literature Review",
      description: "Comprehensive analysis of existing research",
      guidelines: [
        "Use credible academic sources",
        "Document all references properly",
        "Analyze existing research thoroughly",
        "Identify research gaps and opportunities",
      ],
      icon: Search,
      status: "essential",
    },
    {
      step: "3",
      title: "Research Methodology",
      description: "Design your research approach",
      guidelines: [
        "Choose appropriate research methods",
        "Design data collection instruments",
        "Consider ethical implications",
        "Plan data analysis procedures",
      ],
      icon: Users,
      status: "essential",
    },
  ]

  const documentationGuidelines = [
    {
      category: "Format Requirements",
      requirements: [
        "Use APA 7th Edition format",
        "12-point Times New Roman font",
        "Double-spaced paragraphs",
        "1-inch margins on all sides",
        "Include page numbers and headers",
      ],
    },
    {
      category: "Structure Requirements",
      requirements: [
        "Title page with all required information",
        "Abstract (150-250 words)",
        "Introduction with clear thesis statement",
        "Literature review section",
        "Methodology and results sections",
        "Discussion and conclusion",
        "Complete reference list",
      ],
    },
  ]

  const importantDeadlines = [
    {
      milestone: "Proposal Submission",
      date: "Start of semester",
      status: "upcoming",
      description: "Submit your research proposal for approval",
    },
    {
      milestone: "Progress Report",
      date: "Mid-semester",
      status: "current",
      description: "Submit progress update and preliminary findings",
    },
    {
      milestone: "Final Paper",
      date: "End of semester",
      status: "upcoming",
      description: "Submit completed research paper",
    },
    {
      milestone: "Presentation",
      date: "Final week",
      status: "upcoming",
      description: "Present your research findings",
    },
  ]

  const getStatusBadge = (status) => {
    const statusConfig = {
      essential: { variant: "default", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      current: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      upcoming: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    }
    return statusConfig[status] || statusConfig.upcoming
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "current":
        return <CheckCircle className="w-4 h-4" />
      case "upcoming":
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
	<div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Research Guidelines</h1>
          <p className="text-gray-600">Essential information for conducting research</p>
        </div>
      </div>

      {/* Research Process */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <ClipboardCheck className="w-5 h-5 text-blue-600 mr-2" />
            <CardTitle className="text-lg font-semibold">Research Process</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {researchProcess.map((process, index) => {
              const Icon = process.icon
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                        {process.step}
                      </div>
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <Badge
                      variant={getStatusBadge(process.status).variant}
                      className={getStatusBadge(process.status).className}
                    >
                      {process.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{process.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{process.description}</p>
                  <ul className="space-y-2">
                    {process.guidelines.map((guideline, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        {guideline}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documentation Guidelines */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <CardTitle className="text-lg font-semibold">Documentation Guidelines</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {documentationGuidelines.map((section, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="font-semibold text-gray-900 mb-4">{section.category}</h3>
                <ul className="space-y-3">
                  {section.requirements.map((requirement, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Deadlines */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <CardTitle className="text-lg font-semibold">Important Deadlines</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {importantDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-4">
                    {getStatusIcon(deadline.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{deadline.milestone}</h3>
                    <p className="text-sm text-gray-600">{deadline.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={getStatusBadge(deadline.status).variant}
                    className={getStatusBadge(deadline.status).className}
                  >
                    {deadline.date}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
            <CardTitle className="text-lg font-semibold">Additional Resources</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Citation Styles</h4>
              <p className="text-sm text-blue-700">APA, MLA, Chicago, IEEE, and Harvard citation formats</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Research Templates</h4>
              <p className="text-sm text-green-700">Pre-formatted templates for different research types</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Writing Support</h4>
              <p className="text-sm text-purple-700">Grammar guides and academic writing resources</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GuidelinesPage
