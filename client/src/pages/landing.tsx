import { motion } from "framer-motion";
import { Upload, BarChart3, Search, Sparkles } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-32 w-20 h-20 bg-white rounded-full"
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-16 h-16 bg-white rounded-full"
          animate={{ y: [-5, 15, -5] }}
          transition={{ duration: 3, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Navigation */}
      <nav className="glass-effect relative z-10 px-6 py-4 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-2.5 dashboard-gradient rounded-xl shadow-md">
              <Search className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient-primary">ATS-Scan</span>
          </motion.div>
          <div className="hidden md:flex space-x-8 text-slate-700 font-medium">
            <a href="#" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
          </div>
          <Button className="btn-primary shadow-lg">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              className="inline-block text-gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: "auto" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            >
              Get Your Resume ATS-Ready
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Beat the bots and land more interviews with our AI-powered resume analyzer.
            Get instant feedback and actionable improvements.
          </motion.p>

          {/* Upload Zone */}
          <motion.div
            className="max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <FileUpload />
          </motion.div>

          {/* Feature Preview Cards */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Card className="glassmorphism border-white/20 p-6 hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">ATS Score</h3>
              <p className="text-blue-100">Real-time scoring with detailed breakdown and improvement suggestions</p>
            </Card>

            <Card className="glassmorphism border-white/20 p-6 hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Search className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Keyword Analysis</h3>
              <p className="text-blue-100">Match your resume keywords with job requirements instantly</p>
            </Card>

            <Card className="glassmorphism border-white/20 p-6 hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Enhancement</h3>
              <p className="text-blue-100">Get AI-powered suggestions to improve your resume content</p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
