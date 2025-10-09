export const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="border-t border-slate-300 bg-white p-6 transition-colors dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    © {currentYear} OMSC R-kive. All rights reserved.
                </p>
                <div className="flex items-center gap-x-6 text-sm">
                    <a 
                        href="/privacy" 
                        className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                    >
                        Privacy Policy
                    </a>
                    <a 
                        href="/terms" 
                        className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                    >
                        Terms of Service
                    </a>
                    <a 
                        href="/contact" 
                        className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                    >
                        Contact
                    </a>
                </div>
            </div>
        </footer>
    );
};
