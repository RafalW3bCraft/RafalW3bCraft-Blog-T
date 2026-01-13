import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Contact from "@/pages/Contact";
import Community from "@/pages/Community";
import Admin from "@/pages/Admin";
import AdminBlogEditor from "@/pages/AdminBlogEditor";
import AdminMessages from "@/pages/AdminMessages";
import AdminPosts from "@/pages/AdminPosts";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SharedDraft from "@/pages/SharedDraft";
import Settings from "@/pages/Settings";
import { UserBlog } from "@/pages/UserBlog";
import { SiteBuilder } from "@/pages/SiteBuilder";


function Router() {
  

  return (
    <Switch>
      
      <Route path="/blog" component={Blog} />
      <Route path="/contact" component={Contact} />
      <Route path="/community" component={Community} />
      
      
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/site-builder" component={SiteBuilder} />
      
      
      <Route path="/user/:username" component={UserBlog} />
      
      
      <Route path="/blog/:slug" component={BlogPost} />
      
      
      <Route path="/shared-draft/:shareId" component={SharedDraft} />
      
      
      <Route path="/admin" component={Admin} />
      <Route path="/admin/messages" component={AdminMessages} />
      <Route path="/admin/posts" component={AdminPosts} />
      <Route path="/admin/new-post" component={AdminBlogEditor} />
      <Route path="/admin/edit-post/:id" component={AdminBlogEditor} />
      
      
      <Route path="/" component={Home} />
      
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
