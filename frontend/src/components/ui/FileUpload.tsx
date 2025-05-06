'use client';

import { useDropzone } from 'react-dropzone';
import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

type FileUploadProps = {
    onFileSelect: (file: File) => void;
    error?: string;
};

export default function FileUpload({ onFileSelect, error: externalError }: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [internalError, setInternalError] = useState<string | null>(null);

    // Determine which error to display (external error takes precedence)
    const displayError = externalError || internalError;

    const isValidFile = (file: File) => {
        return file.name.endsWith('.nii') || file.name.endsWith('.nii.gz');
    };

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0 && isValidFile(acceptedFiles[0])) {
                setFiles(acceptedFiles);
                setInternalError(null);
                onFileSelect(acceptedFiles[0]);
            } else {
                setFiles([]);
                setInternalError('Only .nii and .nii.gz files are allowed.');
            }
        },
        [onFileSelect]
    );

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
                {files.length === 0 ? (
                    <>
                        <UploadCloud className="text-blue-500 w-32 h-32" size={48} />
                        <p className="text-2xl font-bold w-42">
                            {isDragActive ? 'Drop the file here...' : 'Drag and drop or choose file:'}
                        </p>
                    </>
                ) : (
                    <p className="font-bold">{files[0].name}</p>
                )}
                <button
                    type="button"
                    onClick={open}
                    className="blue-button"
                >
                    {files.length === 0 ? 'Choose File' : 'Choose Other Files'}
                </button>
                {displayError && <p className="text-red-600 font-semibold">{displayError}</p>}
            </CardContent>
        </Card>
    );
}
