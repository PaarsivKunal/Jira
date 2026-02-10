import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AccountDetails = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Registration is disabled - users must be created by admin
    toast.error('Registration is disabled. Please contact your administrator to create an account.');
    navigate('/login');
  }, [navigate]);

  return null;
};

export default AccountDetails;

