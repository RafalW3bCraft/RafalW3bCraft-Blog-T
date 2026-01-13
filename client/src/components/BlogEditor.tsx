import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertBlogPostSchema } from '@shared/schema';
import ReactMarkdown from 'react-markdown';
import { Eye, Save, Send, X } from 'lucide-react';

const blogPostFormSchema = insertBlogPostSchema.extend({
  tags: z.array(z.string()).default([]),
});

type BlogPostFormData = z.infer<typeof blogPostFormSchema>;

interface BlogEditorProps {
  initialData?: Partial<BlogPostFormData> & { id?: number };
  onSave?: (data: BlogPostFormData) => void;
  isEditing?: boolean;
}

export function BlogEditor({ initialData, onSave, isEditing = false }: BlogEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      published: false,
      isDraft: true,
      tags: [],
      ...initialData,
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: BlogPostFormData & { isDraft?: boolean }) => {
      const endpoint = isEditing ? `/api/blog/posts/${initialData?.id}` : '/api/blog/posts';
      const method = isEditing ? 'PUT' : 'POST';
      await apiRequest(method, endpoint, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      const isDraft = variables.isDraft;
      toast({
        title: isEditing ? 'Post Updated' : (isDraft ? 'Draft Saved' : 'Post Published'),
        description: isEditing 
          ? 'Your blog post has been updated successfully.' 
          : (isDraft ? 'Your draft has been saved.' : 'Your blog post has been published successfully.'),
      });
      if (onSave) {
        onSave(form.getValues());
      } else if (!isEditing) {
        form.reset();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save post',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BlogPostFormData) => {
    const processedData = generateSlugIfEmpty(data);
    createPostMutation.mutate({ ...processedData, isDraft: false, published: true });
  };

  const onSaveDraft = () => {
    const data = form.getValues();
    const processedData = generateSlugIfEmpty(data);
    createPostMutation.mutate({ ...processedData, isDraft: true, published: false });
  };

  
  const handleTitleChange = (title: string) => {
    if (!initialData?.id) { 
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'untitled-post';
      form.setValue('slug', slug);
    }
  };

  
  const generateSlugIfEmpty = (data: BlogPostFormData) => {
    if (!data.slug || data.slug.trim() === '') {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `post-${Date.now()}`;
      data.slug = slug;
    }
    return data;
  };

  
  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue('tags', [...currentTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  
  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const watchedContent = form.watch('content');

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-cyber text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="text-neon-cyan">MARKDOWN</span>{' '}
            <span className="text-neon-green">EDITOR</span>
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-cyber text-xl text-neon-cyan">Content Editor</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="border-neon-green text-neon-green hover:bg-neon-green hover:text-matrix-black font-mono"
                >
                  <Eye size={16} className="mr-1" />
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neon-green font-mono text-sm">Title:</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter post title..."
                          onChange={(e) => {
                            field.onChange(e);
                            handleTitleChange(e.target.value);
                          }}
                          className="bg-transparent border-neon-cyan text-white font-mono focus:border-neon-green"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neon-green font-mono text-sm">Slug:</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="post-slug-url"
                          className="bg-transparent border-neon-cyan text-white font-mono focus:border-neon-green"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neon-green font-mono text-sm">Excerpt (Optional):</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          rows={2}
                          placeholder="Brief description of the post..."
                          className="bg-transparent border-neon-cyan text-white font-mono focus:border-neon-green resize-none"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                
                <div>
                  <label className="text-neon-green font-mono text-sm block mb-2">Tags:</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag..."
                      className="bg-transparent border-neon-cyan text-white font-mono focus:border-neon-green"
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.watch('tags') || []).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-cyber-purple text-cyber-purple font-mono"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neon-green font-mono text-sm">Content:</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={12}
                          placeholder="# Your Markdown Content Here..."
                          className="bg-transparent border-neon-cyan text-white font-mono focus:border-neon-green resize-none custom-scrollbar"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-neon-green font-mono text-sm">
                          Publish immediately
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={onSaveDraft}
                    disabled={createPostMutation.isPending}
                    className="border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black px-6 py-2 rounded font-mono flex-1 transition-colors duration-200"
                  >
                    {createPostMutation.isPending ? 'SAVING...' : (
                      <>
                        <Save size={16} className="mr-2" />
                        SAVE DRAFT
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending}
                    className="cyber-button px-6 py-2 rounded font-mono flex-1"
                  >
                    {createPostMutation.isPending ? 'PUBLISHING...' : (
                      <>
                        <Send size={16} className="mr-2" />
                        PUBLISH
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          
          <div className="glass-morphism p-6 rounded-lg">
            <h3 className="font-cyber text-xl text-neon-green mb-4">Live Preview</h3>
            <div className="prose prose-invert max-w-none custom-scrollbar max-h-[600px] overflow-y-auto">
              {showPreview ? (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-white font-cyber text-2xl mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-neon-cyan font-cyber text-xl mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-neon-green font-cyber text-lg mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                    code: ({ children }) => <code className="text-neon-green bg-cyber-gray px-2 py-1 rounded font-mono text-sm">{children}</code>,
                    pre: ({ children }) => <pre className="bg-matrix-black border border-neon-cyan rounded-lg p-4 overflow-x-auto">{children}</pre>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-neon-cyan pl-4 text-gray-400 italic">{children}</blockquote>,
                    a: ({ children, href }) => <a href={href} className="text-neon-cyan hover:text-neon-green transition-colors duration-300">{children}</a>,
                  }}
                >
                  {watchedContent || '# Your Post Title\n\nYour markdown content will be rendered here in real-time as you type...'}
                </ReactMarkdown>
              ) : (
                <div className="text-gray-400 text-center py-12 font-mono">
                  Click "Preview" to see rendered content
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
