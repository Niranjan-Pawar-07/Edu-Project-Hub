import React, { useState, useEffect } from "react";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
} from "firebase/firestore";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import { db, storage, auth } from "../firebase";

const FileSharing = ({ teamId }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (teamId) fetchFiles();
    }, [teamId]);

    const fetchFiles = async () => {
        try {
            const q = query(
                collection(db, "teams", teamId, "files"),
                orderBy("uploadedAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const filesData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setFiles(filesData);
        } catch (error) {
            console.error("Error fetching files:", error);
            alert("Failed to fetch files. Check your network or permissions.");
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!currentUser) {
            alert("You must be logged in to upload files.");
            return;
        }
        setUploading(true);
        setUploadProgress(0);
        const fileRef = ref(
            storage,
            `teams/${teamId}/files/${Date.now()}_${file.name}`
        );
        const uploadTask = uploadBytesResumable(fileRef, file);
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                alert("Failed to upload file. Please check your connection and try again.");
                setUploading(false);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(fileRef);
                    await addDoc(collection(db, "teams", teamId, "files"), {
                        name: file.name,
                        type: file.type || "unknown",
                        size: file.size,
                        uploadedBy: currentUser.uid,
                        uploadedAt: serverTimestamp(),
                        downloadURL,
                        storageRef: fileRef.fullPath,
                    });
                    await fetchFiles();
                } catch (error) {
                    console.error("Saving file metadata failed:", error);
                    alert("Upload succeeded but saving metadata failed.");
                } finally {
                    setUploading(false);
                    setUploadProgress(0);
                    e.target.value = null;
                }
            }
        );
    };

    const handleDeleteFile = async (fileId, storageRef) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            const fileRef = ref(storage, storageRef);
            await deleteObject(fileRef);
        } catch (error) {
            console.error("Storage delete failed:", error);
            alert("Failed to delete file from storage.");
        }
        try {
            await deleteDoc(doc(db, "teams", teamId, "files", fileId));
            setFiles((prev) => prev.filter((file) => file.id !== fileId));
        } catch (error) {
            console.error("Metadata delete failed:", error);
            alert("Failed to remove file metadata.");
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Team Files</h2>

            <div className="mb-6">
                <label className="block mb-2 font-medium">Upload File</label>
                <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="file-input"
                />
                {uploading && (
                    <div className="mt-2">
                        <div className="w-full bg-gray-200 h-2 rounded">
                            <div
                                className="bg-blue-600 h-2 rounded"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-xs mt-1">Uploading: {uploadProgress}%</p>
                    </div>
                )}
            </div>

            {files.length > 0 ? (
                <ul className="space-y-4">
                    {files.map((file) => (
                        <li
                            key={file.id}
                            className="flex items-center justify-between bg-gray-100 p-3 rounded"
                        >
                            <div>
                                <a
                                    href={file.downloadURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="text-blue-700 font-medium hover:underline"
                                >
                                    {file.name}
                                </a>
                                <div className="text-sm text-gray-600">
                                    {file.type} • {formatFileSize(file.size)}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteFile(file.id, file.storageRef)}
                                className="text-red-600 hover:text-red-800 text-sm"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No files uploaded yet.</p>
            )}
        </div>
    );
};

export default FileSharing;
