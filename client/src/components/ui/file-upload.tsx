import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "./card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await apiRequest('POST', '/api/resumes/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      // Check if session was cleared
      const sessionCleared = data.session_cleared || false;
      
      toast({
        title: "Success!",
        description: sessionCleared 
          ? "Your resume has been analyzed successfully. All previous data has been cleared." 
          : "Your resume has been analyzed successfully.",
      });
      
      // Navigate to the dashboard with the new resume ID
      setLocation(`/dashboard/${data.resume.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and analyze resume",
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    // Check if file type is allowed or if it's a PDF with incorrect mime type
    const isAllowedType = allowedTypes.includes(selectedFile.type) || 
                          (selectedFile.name.toLowerCase().endsWith('.pdf')) ||
                          (selectedFile.name.toLowerCase().endsWith('.doc')) ||
                          (selectedFile.name.toLowerCase().endsWith('.docx')) ||
                          (selectedFile.name.toLowerCase().endsWith('.txt'));
                          
    if (!isAllowedType) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOC, DOCX, or TXT file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Clear any previous file state
    setFile(null);
    
    // Set the new file and upload it
    setFile(selectedFile);
    uploadMutation.mutate(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  return (
    <Card className="glassmorphism border-white/50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 group cursor-pointer animate-pulse-glow">
      <motion.div
        className={`border-2 border-dashed rounded-xl p-12 transition-colors ${
          isDragging ? 'border-white bg-white/10' : 'border-white/50'
        } ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInputChange}
          disabled={uploadMutation.isPending}
        />

        {uploadMutation.isPending ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <h3 className="text-2xl font-semibold text-white mb-2">Processing Resume...</h3>
            <p className="text-blue-100">Analyzing your document with AI</p>
          </div>
        ) : file ? (
          <div className="text-center">
            <FileText className="text-6xl text-white mb-4 mx-auto" />
            <h3 className="text-2xl font-semibold text-white mb-2">{file.name}</h3>
            <p className="text-blue-100">File uploaded successfully!</p>
          </div>
        ) : (
          <div className="text-center">
            <motion.div
              animate={{ y: isDragging ? -5 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Upload className="text-6xl text-white mb-4 mx-auto group-hover:animate-bounce" />
            </motion.div>
            <h3 className="text-2xl font-semibold text-white mb-2">Drop Your Resume Here</h3>
            <p className="text-blue-100 mb-4">Or click to browse files</p>
            <p className="text-sm text-blue-200">Supports PDF, DOC, DOCX, TXT (Max 5MB)</p>
          </div>
        )}

        {uploadMutation.error && (
          <div className="mt-4 p-3 bg-red-500/20 rounded-lg flex items-center text-white">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span className="text-sm">Upload failed. Please try again.</span>
          </div>
        )}
      </motion.div>
    </Card>
  );
}
