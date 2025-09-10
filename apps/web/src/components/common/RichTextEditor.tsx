'use client';

import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  onImageUpload,
  placeholder = 'Enter your content here...',
  height = 400,
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  const handleImageUpload = async (blobInfo: any, progress: (percent: number) => void) => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        if (!onImageUpload) {
          reject('Image upload not configured');
          return;
        }

        progress(0);
        const file = blobInfo.blob();
        
        progress(50);
        const url = await onImageUpload(file);
        
        progress(100);
        resolve(url);
      } catch (error) {
        reject(error);
      }
    });
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Editor
        onInit={(_evt, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={handleEditorChange}
        disabled={disabled}
        init={{
          height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 
            'undo redo | blocks | bold italic forecolor backcolor | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | removeformat | ' +
            'link image media table | code preview fullscreen help',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              font-size: 14px;
              line-height: 1.6;
            }
          `,
          placeholder,
          branding: false,
          images_upload_handler: onImageUpload ? handleImageUpload : undefined,
          automatic_uploads: true,
          file_picker_types: 'image',
          paste_data_images: true,
          setup: (editor) => {
            editor.on('init', () => {
              if (disabled) {
                editor.getBody().setAttribute('contenteditable', 'false');
              }
            });
          },
        }}
      />
    </div>
  );
}