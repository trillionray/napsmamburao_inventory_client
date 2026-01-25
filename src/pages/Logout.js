import { useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';

import UserContext from '../context/UserContext';

export default function Logout() {
    const { setUser, unsetUser } = useContext(UserContext);

    useEffect(() => {
        // Clear local storage and reset user state
        unsetUser();

        setUser({
            id: null,
            role: null
        });
    }, []);

    // Redirect to login page
    return <Navigate to="/login" />;
}