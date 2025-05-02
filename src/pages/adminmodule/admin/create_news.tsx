import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, storage } from '@/firebase/firebase';
import { v4 as uuidv4 } from 'uuid';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import { auth } from '@/firebase/firebase';

const CreateNewsPage = () => {
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [titleError, setTitleError] = useState('');
    const [captionError, setCaptionError] = useState('');
    const router = useRouter();
    const { userType } = useUser();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                await router.push('/adminmodule/login');
            } else if (userType !== 'admin') {
                await signOut(auth);
                await router.push('/adminmodule/login');
            }
        });

        return () => unsubscribe();
    }, [router, userType]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            // Filter to only include png, jpeg, and jpg files
            const newImages = Array.from(files).filter(file => 
                file.type === 'image/png' || 
                file.type === 'image/jpeg' || 
                file.type === 'image/jpg'
            );
            
            // You may want to check if newImages is empty and alert the user
            if (newImages.length === 0) {
                alert('Please upload valid image files (PNG, JPEG, JPG).');
                return;
            }
            
            setImages((prevImages) => [...prevImages, ...newImages]);
        }
    };
    
    const handleImageRemove = (index: number) => {
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    };
    
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files) {
            // Filter to only include png, jpeg, and jpg files
            const newImages = Array.from(files).filter(file => 
                file.type === 'image/png' || 
                file.type === 'image/jpeg' || 
                file.type === 'image/jpg'
            );
            
            // You may want to check if newImages is empty and alert the user
            if (newImages.length === 0) {
                alert('Please drop valid image files (PNG, JPEG, JPG).');
                return;
            }
            
            setImages((prevImages) => [...prevImages, ...newImages]);
        }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };
    

    const validateForm = () => {
        let isValid = true;

        if (!title) {
            setTitleError('Title is required');
            isValid = false;
        } else {
            setTitleError('');
        }

        if (!caption) {
            setCaptionError('Caption is required');
            isValid = false;
        } else {
            setCaptionError('');
        }

        return isValid;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const imageUrls: string[] = [];

            await Promise.all(
                images.map(async (image) => {
                    const imageRef = ref(storage, `news/${uuidv4()}_${image.name}`);
                    await uploadBytes(imageRef, image);
                    const url = await getDownloadURL(imageRef);
                    imageUrls.push(url);
                })
            );

            await addDoc(collection(db, 'news'), {
                title,
                caption,
                images: imageUrls,
                createdAt: Date.now(),
            });

            setTitle('');
            setCaption('');
            setImages([]);
            alert('News created successfully!');
        } catch (error) {
            console.error("Error uploading images or saving to Firestore:", error);
            alert('Error creating news. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5">
            <form onSubmit={handleSubmit} className="w-full flex gap-5">
                <div id="news" className="block gap-5">
                    <div className="rounded-lg bg-white border p-5">
                        <h1 className="font-semibold">{title || 'News Title'}</h1>
                        <p className="font-medium text-gray-600 text-xs">CreatedAt</p>
                        <hr className="my-2" />
                        <p className="text-justify text-xs">{caption || 'News Caption'}</p>
                        <div className='grid grid-cols-3 gap-2 w-full'>
                            {images.map((image, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={URL.createObjectURL(image)}
                                        alt="uploaded"
                                        className="object-fill rounded-lg w-full"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleImageRemove(index)}
                                        className="absolute top-2 right-2"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="black" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div id="upload" className="p-5 grid gap-5 rounded-lg border bg-white">
                    <h2>Create News</h2>
                    <div className="block">
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                        {titleError && <p className="text-red-500 text-xs">{titleError}</p>}

                        <label htmlFor="caption">News Caption</label>
                        <textarea
                            name="caption"
                            id="caption"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="border p-2 rounded w-full"
                        ></textarea>
                        {captionError && <p className="text-red-500 text-xs">{captionError}</p>}
                    </div>

                    <input
                        type="file"
                        accept=".png, .jpg, .jpeg" // Specify only PNG and JPEG formats
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id="file-upload"
                    />

                    <div
                        className="bg-slate-100 border-black border-dashed h-40 w-full border-2 rounded-lg flex justify-center items-center cursor-pointer"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <p>Upload files here</p>
                    </div>

                    <button type="submit" className="flex bg-[#272727] justify-center text-white py-2 rounded w-full hover:bg-[#272727]">
                        {loading ? (
                            <svg className='animate-spin mr-2' width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M29.3413 11.1792C29.8684 11.0146 30.1655 10.4523 29.9673 9.93683C29.0317 7.50371 27.4952 5.34041 25.4945 3.6526C23.2384 1.74938 20.4858 0.529898 17.5604 0.137549C14.6349 -0.254801 11.6583 0.196297 8.98046 1.4378C6.30263 2.6793 4.03495 4.65958 2.44408 7.14579C0.853204 9.632 0.00528502 12.5208 2.4616e-05 15.4724C-0.00523579 18.424 0.832381 21.3158 2.41438 23.8076C3.99638 26.2995 6.25699 28.2878 8.93037 29.5389C11.3012 30.6483 13.9092 31.137 16.5105 30.967C17.0616 30.931 17.4477 30.4257 17.3762 29.8781L16.9632 26.713C16.8917 26.1654 16.3894 25.7845 15.8374 25.8025C14.2191 25.8555 12.606 25.5266 11.131 24.8364C9.35307 24.0044 7.84968 22.682 6.7976 21.0249C5.74551 19.3677 5.18846 17.4446 5.19196 15.4816C5.19546 13.5187 5.75936 11.5976 6.81734 9.94415C7.87533 8.29074 9.38342 6.97378 11.1643 6.14813C12.9451 5.32249 14.9247 5.0225 16.8702 5.28342C18.8157 5.54435 20.6463 6.35535 22.1467 7.62106C23.3915 8.67116 24.366 9.99802 24.996 11.4897C25.2108 11.9984 25.7671 12.2949 26.2943 12.1303L29.3413 11.1792Z" fill="white" />
                            </svg>
                        ) : (
                            'Create News'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateNewsPage;
