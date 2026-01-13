import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Shield, Mail, Linkedin, Twitter, Github, Send } from 'lucide-react';
import { insertContactMessageSchema } from '@shared/schema';

const contactFormSchema = insertContactMessageSchema.extend({
  subject: z.string().min(1, 'Subject is required'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export function ContactSection() {
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      await apiRequest('POST', '/api/contact', data);
    },
    onSuccess: () => {
      toast({
        title: 'Message Sent',
        description: 'Your secure message has been transmitted successfully.',
        variant: 'default',
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Transmission Failed',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-t from-transparent to-dark-gray">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="font-cyber text-3xl md:text-4xl font-bold text-center mb-12">
          <span className="text-neon-cyan">SECURE</span>{' '}
          <span className="text-neon-green">CONTACT</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="glass-morphism p-8 rounded-lg">
            <h3 className="font-cyber text-2xl text-neon-cyan mb-6">Get In Touch</h3>
            <p className="text-gray-300 mb-6">
              Ready to discuss cybersecurity solutions, red team engagements, or security consulting? 
              Let's connect through secure channels.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="text-neon-green" size={20} />
                <a href="mailto:thewhitefalcon13@proton.me" className="font-mono text-sm hover:text-neon-cyan transition-colors">
                  thewhitefalcon13@proton.me
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Send className="text-cyber-purple" size={20} />
                <a href="https://t.me/RafalW3bCraft" target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:text-neon-cyan transition-colors">
                  @RafalW3bCraft
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Github className="text-neon-cyan" size={20} />
                <a href="https://github.com/RafalW3bCraft" target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:text-neon-cyan transition-colors">
                  github.com/RafalW3bCraft
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Twitter className="text-gold-accent" size={20} />
                <a href="https://x.com/RafalW3bCraft" target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:text-neon-cyan transition-colors">
                  @RafalW3bCraft
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-cyber-gray">
              <h4 className="font-cyber text-neon-green mb-4">Additional Channels</h4>
              <div className="space-y-2">
                <a href="https://www.reddit.com/user/Geraki_init/" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-neon-cyan transition-colors font-mono text-sm">
                  • Reddit: u/Geraki_init
                </a>
                <div className="text-gray-400 font-mono text-sm">
                  • Secure PGP communications available
                </div>
                <div className="text-gray-400 font-mono text-sm">
                  • OPSEC compliant messaging protocols
                </div>
              </div>
            </div>
          </div>

          <div className="terminal-window p-6">
            <div className="flex items-center mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-400 text-sm ml-4 font-mono">secure-contact.sh</span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neon-green font-mono text-sm">Name:</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your name"
                          className="bg-transparent border-neon-cyan text-white font-mono focus:border-neon-green"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neon-green font-mono text-sm">Email:</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Email address"
                          className="bg-transparent border-neon-cyan text-white font-mono focus:border-neon-green"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neon-green font-mono text-sm">Subject:</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-transparent border-neon-cyan text-white font-mono focus:border-neon-green">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-matrix-black border-neon-cyan">
                          <SelectItem value="consultation">Security Consultation</SelectItem>
                          <SelectItem value="redteam">Red Team Engagement</SelectItem>
                          <SelectItem value="training">Security Training</SelectItem>
                          <SelectItem value="general">General Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neon-green font-mono text-sm">Message:</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="Describe your security requirements"
                          className="bg-transparent border-neon-cyan text-white font-mono focus:border-neon-green resize-none"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={contactMutation.isPending}
                  className="w-full cyber-button py-3 rounded font-mono"
                >
                  {contactMutation.isPending ? 'TRANSMITTING...' : 'SEND_MESSAGE >>'} 
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
