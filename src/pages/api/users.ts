// pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/firebase/firebaseAdmin';
import admin from 'firebase-admin';

interface User {
    id?: string;
    name: string;
    email: string;
    type: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    switch (method) {
        case 'GET':
            return await getUsers(req, res);
        case 'POST':
            return await addUser(req, res);
        case 'PUT':
            return await editUser(req, res);
        case 'DELETE':
            return await deleteUser(req, res);
        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

const getUsers = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const usersRef = dbAdmin.collection('users');
        const snapshot = await usersRef.where('type', 'in', ['admin', 'barangay']).get();

        const users: User[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const addUser = async (req: NextApiRequest, res: NextApiResponse) => {
    const { email, password, fullName, name, type, address } = req.body;

    if (!email || !password || !fullName || !name || !type || !address) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Create a new user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: fullName, // Optional: Use displayName for full name
        });

        // Create a new document in Firestore
        await dbAdmin.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            fullName,
            name,
            type,
            address,
        });

        res.status(201).json({ message: 'User created successfully', uid: userRecord.uid });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

    
const editUser = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query; // Assuming the id is the user's UID
    const { email, fullName, name, type, address } = req.body;

    if (typeof id !== 'string' || !email || !fullName || !name || !type || !address) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        // Update user in Firebase Auth
        await admin.auth().updateUser(id, {
            email,
            displayName: fullName,
        });

        // Update the Firestore document
        await dbAdmin.collection('users').doc(id).update({
            email,
            fullName,
            name,
            type,
            address,
        });

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

const deleteUser = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        // Fetch the user document to get the UID
        const userDoc = await dbAdmin.collection('users').doc(id).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const uid = userData?.uid; // Assuming you store the Firebase Auth UID in the user document

        // Delete the user from Firebase Authentication
        if (uid) {
            await admin.auth().deleteUser(uid);
        }

        // Delete the user document from Firestore
        await dbAdmin.collection('users').doc(id).delete();

        res.status(204).end(); // No content
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
