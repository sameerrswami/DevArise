"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  Award, 
  Zap,
  PlayCircle,
  Database,
  Cpu,
  Globe,
  Code2,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

const COURSE_ICONS = {
  "Operating Systems": <Cpu className="h-8 w-8 text-violet-400" />,
  "Database Systems": <Database className="h-8 w-8 text-blue-400" />,
  "Computer Networks": <Globe className="h-8 w-8 text-emerald-400" />,
  "OOPs": <Code2 className="h-8 w-8 text-amber-400" />
};

export default function CoursesCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
         <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
         <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading CS Fundamentals...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-32">
        <header className="mb-16 space-y-4 max-w-3xl">
           <Badge className="bg-violet-600/10 text-violet-400 border-violet-500/20 px-6 py-2 rounded-2xl font-bold uppercase tracking-widest text-[10px]">Level Up Your Foundations</Badge>
           <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
             CS <span className="text-violet-500">Fundamentals</span> Hub
           </h1>
           <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
             Master the core principles of computer science with structured courses, high-quality visuals, and AI-powered active recall.
           </p>
           
           <div className="flex gap-4 pt-8">
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                 <Input 
                   placeholder="Search for subjects, topics, or keywords..." 
                   className="pl-12 bg-slate-900/50 border-slate-800 rounded-2xl h-14 text-lg focus:ring-violet-500/20"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <Button className="h-14 px-8 bg-violet-600 hover:bg-violet-500 rounded-2xl font-bold text-lg">
                 Find Path
              </Button>
           </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {filteredCourses.map((course, idx) => (
             <CourseCard key={course.id} course={course} idx={idx} />
           ))}
        </section>

        {filteredCourses.length === 0 && (
           <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[50px]">
              <BookOpen className="h-16 w-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest">No Fundamental paths found</p>
           </div>
        )}
      </div>

      {/* Featured Topics Section */}
      <div className="max-w-7xl mx-auto px-6 mt-32">
         <div className="bg-slate-900/50 border border-slate-800 rounded-[60px] p-12 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-20 group-hover:translate-x-0 transition-transform duration-1000">
               <Zap className="h-64 w-64 text-white" />
            </div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
               <div className="space-y-6">
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Interview Hotlist</Badge>
                  <h2 className="text-4xl font-black">Frequently Asked <span className="text-amber-500">Concepts</span></h2>
                  <p className="text-slate-400">We've identified 40+ key concepts that appear in 80% of technical interviews. Focus your prep where it matters most.</p>
                  <div className="grid grid-cols-2 gap-4">
                     {["Deadlocks", "ACID Properties", "Normal Forms", "B-Trees", "Encapsulation", "TCP vs UDP"].map(topic => (
                       <div key={topic} className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-bold text-slate-300">{topic}</span>
                       </div>
                     ))}
                  </div>
                  <Button className="bg-slate-100 text-slate-950 hover:bg-white rounded-2xl h-14 px-8 font-black flex gap-2">
                     Learn High-Yield Topics <ChevronRight className="h-4 w-4" />
                  </Button>
               </div>
               <div className="hidden md:block">
                  <div className="grid grid-cols-2 gap-6 scale-110">
                     {[1,2,3,4].map(i => (
                        <div key={i} className="h-40 bg-slate-950 rounded-3xl border border-slate-800 p-6 flex flex-col justify-end">
                           <div className="h-8 w-8 rounded-xl bg-violet-600/20 mb-4" />
                           <div className="h-2 w-20 bg-slate-800 rounded-full mb-2" />
                           <div className="h-2 w-12 bg-slate-800 rounded-full" />
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function CourseCard({ course, idx }) {
  const icon = COURSE_ICONS[course.title] || <BookOpen className="h-8 w-8 text-primary" />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
    >
      <Link href={`/courses/${course.id}`}>
        <Card className="h-full bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[40px] hover:border-violet-500/50 transition-all group overflow-hidden cursor-pointer shadow-2xl hover:shadow-violet-900/20">
          <CardContent className="p-8">
            <div className="h-16 w-16 rounded-[24px] bg-slate-950 flex items-center justify-center border border-slate-800 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
               {icon}
            </div>
            
            <Badge className="bg-white/5 text-slate-500 mb-2 border-transparent">Fundamentals</Badge>
            <h3 className="text-2xl font-black mb-3 group-hover:text-violet-400 transition-colors">{course.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-8">
              {course.description || "Master the core principles of this domain with structured modules and expert curation."}
            </p>

            <div className="space-y-4 pt-6 border-t border-slate-800">
               <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> 12h Content</span>
                  <span className="flex items-center gap-1.5"><PlayCircle className="h-3 w-3" /> {course.moduleCount} Modules</span>
               </div>
               
               <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    className="h-full bg-violet-500"
                  />
               </div>
               
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-violet-400 tracking-tighter">Your Progress</span>
                  <span className="text-sm font-black">{course.progress}%</span>
               </div>
            </div>
          </CardContent>
          
          <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
             <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center">
                <ArrowRight className="h-5 w-5" />
             </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function CheckCircle(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
