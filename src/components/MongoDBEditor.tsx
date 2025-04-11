
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy, RefreshCw, User } from 'lucide-react';

const MongoDBEditor: React.FC = () => {
  const { toast } = useToast();
  const [editorContent, setEditorContent] = useState<string>(`/** 
* Paste one or more documents here
*/
{
  "_id": {
    "$oid": "67f87480ce0765f711e0deda"
  }
}`);
  const [isCopied, setIsCopied] = useState(false);

  const handleFormatJson = () => {
    try {
      // Remove comments before parsing
      const contentWithoutComments = editorContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const parsedJson = JSON.parse(contentWithoutComments);
      const formattedJson = JSON.stringify(parsedJson, null, 2);
      setEditorContent(formattedJson);
      toast({
        title: "Document Formatted",
        description: "JSON has been formatted successfully",
      });
    } catch (error) {
      toast({
        title: "Format Error",
        description: "Please check your JSON syntax",
        variant: "destructive",
      });
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editorContent);
    setIsCopied(true);
    toast({
      title: "Copied",
      description: "Document copied to clipboard",
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleReset = () => {
    setEditorContent(`/** 
* Paste one or more documents here
*/
{
  "_id": {
    "$oid": "67f87480ce0765f711e0deda"
  }
}`);
    toast({
      title: "Reset",
      description: "Editor has been reset to default",
    });
  };
  
  const loadUserTemplate = () => {
    setEditorContent(`/** 
* User document template
*/
{
  "_id": {
    "$oid": "67f87480ce0765f711e0deda"
  },
  "userId": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "hashed_password_here"
}`);
    toast({
      title: "User Template Loaded",
      description: "User document template has been loaded",
    });
  };

  return (
    <Card className="bg-dark-foreground/10 border-dark-foreground/20">
      <CardHeader>
        <CardTitle className="text-white">MongoDB Document Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="w-full h-64 p-4 rounded-md bg-dark-foreground/5 text-white font-mono text-sm border border-dark-foreground/20 focus:border-sage focus:outline-none"
            spellCheck="false"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <div>
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-dark-foreground/20 text-gray-400 hover:bg-dark-foreground/20 hover:text-white mr-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={loadUserTemplate}
            variant="outline"
            className="border-dark-foreground/20 text-gray-400 hover:bg-dark-foreground/20 hover:text-white"
          >
            <User className="h-4 w-4 mr-2" />
            Load User Template
          </Button>
        </div>
        <div>
          <Button
            onClick={handleFormatJson}
            variant="outline"
            className="border-sage text-sage hover:bg-sage/20 mr-2"
          >
            Format JSON
          </Button>
          <Button
            onClick={handleCopyToClipboard}
            className="bg-sage hover:bg-sage/90"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MongoDBEditor;
