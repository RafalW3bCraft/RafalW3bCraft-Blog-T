import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Target, 
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Star,
  GitFork,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';
import { apiRequest } from '@/lib/queryClient';

interface PersonalMetrics {
  blogEngagement: {
    totalViews: number;
    avgReadingTime: number;
    completionRate: number;
    bookmarksReceived: number;
    commentsReceived: number;
  };
  portfolioMetrics: {
    githubStats: {
      totalStars: number;
      totalForks: number;
      totalCommits: number;
      contributionStreak: number;
    };
    projectViews: number;
    skillProgression: { [skill: string]: number };
  };
  engagementData: Array<{
    date: string;
    views: number;
    readingTime: number;
    interactions: number;
  }>;
  topContent: Array<{
    title: string;
    type: 'blog' | 'project';
    views: number;
    engagement: number;
  }>;
}

interface LearningPath {
  topic: string;
  progress: number;
  nextSteps: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export function PersonalAnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'skills' | 'learning'>('overview');

  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['personal-metrics', timeframe],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/analytics/stats?timeframe=${timeframe}`);
      return res.json();
    }
  });

  
  const { data: learningPaths = [] } = useQuery({
    queryKey: ['learning-paths'],
    queryFn: async () => {
      
      return [
        {
          topic: 'Advanced Cybersecurity',
          progress: 75,
          nextSteps: ['Complete penetration testing course', 'Practice red team exercises'],
          difficulty: 'advanced' as const
        },
        {
          topic: 'AI/ML Development',
          progress: 60,
          nextSteps: ['Learn TensorFlow', 'Build neural network project'],
          difficulty: 'intermediate' as const
        }
      ];
    }
  });

  
  const { data: benchmarks } = useQuery({
    queryKey: ['industry-benchmarks'],
    queryFn: async () => {
      
      return {
        githubActivity: 75,
        contentEngagement: 60,
        technicalSkills: 90
      };
    }
  });

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading personal analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const skillProgressionData = metrics?.portfolioMetrics.skillProgression ? 
    Object.entries(metrics.portfolioMetrics.skillProgression).map(([skill, level]) => ({
      skill,
      level: level as number
    })) : [];

  const exportReport = async () => {
    try {
      const response = await apiRequest('GET', '/api/analytics/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export analytics report:', error);
    }
  };

  return (
    <div className="space-y-6">
      
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Personal Analytics Dashboard
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
                <SelectTrigger className="w-32 bg-zinc-800 border-zinc-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600">
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
          
          
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'engagement' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('engagement')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Engagement
            </Button>
            <Button
              variant={activeTab === 'skills' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('skills')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Target className="h-4 w-4 mr-2" />
              Skills
            </Button>
            <Button
              variant={activeTab === 'learning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('learning')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Activity className="h-4 w-4 mr-2" />
              Learning Path
            </Button>
          </div>
        </CardHeader>
      </Card>

      
      {activeTab === 'overview' && metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="bg-zinc-900/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{metrics.blogEngagement.totalViews}</div>
                  <div className="text-sm text-zinc-400">Total Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{metrics.blogEngagement.avgReadingTime}m</div>
                  <div className="text-sm text-zinc-400">Avg Reading Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{metrics.blogEngagement.completionRate}%</div>
                  <div className="text-sm text-zinc-400">Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{metrics.blogEngagement.bookmarksReceived}</div>
                  <div className="text-sm text-zinc-400">Bookmarks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          
          <Card className="bg-zinc-900/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">GitHub Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                    <Star className="h-5 w-5" />
                    {metrics.portfolioMetrics.githubStats.totalStars}
                  </div>
                  <div className="text-sm text-zinc-400">Total Stars</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 flex items-center justify-center gap-1">
                    <GitFork className="h-5 w-5" />
                    {metrics.portfolioMetrics.githubStats.totalForks}
                  </div>
                  <div className="text-sm text-zinc-400">Total Forks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{metrics.portfolioMetrics.githubStats.totalCommits}</div>
                  <div className="text-sm text-zinc-400">Total Commits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{metrics.portfolioMetrics.githubStats.contributionStreak}</div>
                  <div className="text-sm text-zinc-400">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>

          
          <Card className="lg:col-span-2 bg-zinc-900/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Engagement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }} 
                  />
                  <Line type="monotone" dataKey="views" stroke="#06B6D4" strokeWidth={2} />
                  <Line type="monotone" dataKey="interactions" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="bg-zinc-900/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Skill Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={skillProgressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="skill" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }} 
                  />
                  <Bar dataKey="level" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          
          <Card className="bg-zinc-900/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Top Performing Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.topContent.slice(0, 5).map((content: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                    <div>
                      <div className="font-medium text-white">{content.title}</div>
                      <div className="text-sm text-zinc-400 capitalize">{content.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cyan-400">{content.views}</div>
                      <div className="text-sm text-zinc-400">views</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          
          {benchmarks && (
            <Card className="lg:col-span-2 bg-zinc-900/90 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Industry Benchmarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">Above Average</div>
                    <div className="text-sm text-zinc-400 mb-2">GitHub Activity</div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">Average</div>
                    <div className="text-sm text-zinc-400 mb-2">Content Engagement</div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">Excellent</div>
                    <div className="text-sm text-zinc-400 mb-2">Technical Skills</div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      
      {activeTab === 'learning' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {learningPaths.map((path: LearningPath, index: number) => (
            <Card key={index} className="bg-zinc-900/90 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center justify-between">
                  {path.topic}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    path.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
                    path.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {path.difficulty}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-400">Progress</span>
                    <span className="text-sm text-cyan-400">{path.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div 
                      className="bg-cyan-400 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${path.progress}%`}}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Next Steps:</h4>
                  <ul className="space-y-1">
                    {path.nextSteps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-sm text-zinc-400 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default PersonalAnalyticsDashboard;