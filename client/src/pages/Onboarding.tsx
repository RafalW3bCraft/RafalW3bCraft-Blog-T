import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Shield, Zap } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    interests: [] as string[],
  });

  
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/oauth-user'],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleComplete = async () => {
    try {
      
      
      
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const interests = [
    'Penetration Testing',
    'Malware Analysis',
    'Network Security',
    'OSINT',
    'Digital Forensics',
    'Web Security',
    'Red Team Operations',
    'Blue Team Defense',
    'DevSecOps',
    'Cryptography',
    'Social Engineering',
    'Incident Response'
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= num
                      ? 'bg-cyan-600 text-white'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {step > num ? <CheckCircle className="w-5 h-5" /> : num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > num ? 'bg-cyan-600' : 'bg-zinc-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-zinc-900/80 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              {step === 1 && 'Welcome to RafalW3bCraft!'}
              {step === 2 && 'Set Up Your Profile'}
              {step === 3 && 'Choose Your Interests'}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {step === 1 && 'Let\'s get you set up with your new account'}
              {step === 2 && 'Tell us about yourself and your expertise'}
              {step === 3 && 'Select your cybersecurity focus areas'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={(user as any)?.profileImageUrl} />
                    <AvatarFallback className="bg-cyan-600 text-white text-2xl">
                      {(user as any)?.firstName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold text-white">
                    Welcome, {(user as any)?.firstName}!
                  </h3>
                  <p className="text-zinc-400 mt-1">
                    Your account has been created successfully
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                      {(user as any)?.provider === 'google' ? '🔍 Google' : '💻 GitHub'}
                    </Badge>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Verified
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-zinc-800 rounded-lg">
                    <Shield className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <h4 className="text-white font-medium">Secure Access</h4>
                    <p className="text-zinc-400 text-sm">OAuth-protected login</p>
                  </div>
                  <div className="text-center p-4 bg-zinc-800 rounded-lg">
                    <User className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <h4 className="text-white font-medium">Role-Based</h4>
                    <p className="text-zinc-400 text-sm">Personalized experience</p>
                  </div>
                  <div className="text-center p-4 bg-zinc-800 rounded-lg">
                    <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <h4 className="text-white font-medium">AI-Powered</h4>
                    <p className="text-zinc-400 text-sm">Smart content tools</p>
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Get Started
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Choose a unique username"
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                  <p className="text-zinc-400 text-sm mt-1">
                    This will be visible to other community members
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about your cybersecurity background..."
                    className="bg-zinc-800 border-zinc-600 text-white min-h-[100px]"
                  />
                  <p className="text-zinc-400 text-sm mt-1">
                    Share your expertise, certifications, or areas of interest
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    disabled={!formData.username.trim()}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-zinc-300">
                  Select areas that interest you. This helps us personalize your experience:
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {interests.map((interest) => (
                    <div
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.interests.includes(interest)
                          ? 'bg-cyan-600/20 border-cyan-400 text-cyan-300'
                          : 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      <div className="text-sm font-medium">{interest}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Complete Setup
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Step {step} of 3 • Your data is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}