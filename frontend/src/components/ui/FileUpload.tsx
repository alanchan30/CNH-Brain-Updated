'use client';

import { useDropzone } from 'react-dropzone';
import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

export default function FileUpload() {
    const [files, setFiles] = useState<any[]>([]);
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles)
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        multiple: false,
        noClick: true,
        noKeyboard: true,
    });


    return (
        <Card className="border-none rounded-2xl shadow-2xl md:p-16 md:px-48 text-center transition hover:shadow-lg">
            <CardContent
                {...getRootProps()}
                className="flex flex-col items-center space-y-4"
            >
                <input {...getInputProps()} />
                {(files.length == 0 ?
                    <>
                        <UploadCloud className="text-blue-500 w-32 h-32" size={48} />
                        <p className="text-2xl font-bold w-42">
                            {isDragActive ? 'Drop the file here...' : 'Drag and drop or choose file:'}
                        </p>
                    </> : <p className=' font-bold'>{files[0].name}</p>)}

                <button
                    type="button"
                    onClick={open}
                    className="blue-button "
                >
                    {(files.length == 0 ? "Choose File" : "Choose Other Files")}
                </button>
            </CardContent>
        </Card>
    );
}


