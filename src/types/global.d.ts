export { };

declare global {
    interface Window {
        showDirectoryPicker(options?: any): Promise<FileSystemDirectoryHandle>;
    }

    interface FileSystemHandle {
        kind: 'file' | 'directory';
        name: string;
        isSameEntry(other: FileSystemHandle): Promise<boolean>;
    }

    interface FileSystemDirectoryHandle extends FileSystemHandle {
        kind: 'directory';
        getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
        getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
        removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
        resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
        values(): AsyncIterableIterator<FileSystemHandle>;
        keys(): AsyncIterableIterator<string>;
        entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
        queryPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
        requestPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
    }

    interface FileSystemFileHandle extends FileSystemHandle {
        kind: 'file';
        getFile(): Promise<File>;
        createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
    }

    interface FileSystemWritableFileStream extends WritableStream {
        write(data: BufferSource | Blob | string | WriteParams): Promise<void>;
        seek(position: number): Promise<void>;
        truncate(size: number): Promise<void>;
    }

    type WriteParams =
        | { type: 'write'; position?: number; data: BufferSource | Blob | string }
        | { type: 'seek'; position: number }
        | { type: 'truncate'; size: number };
}
