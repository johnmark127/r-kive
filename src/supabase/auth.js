import { supabase } from './client';

export const USER_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  SUPERADMIN: 'superadmin',
  ADVISER: 'adviser',
};

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    let message = 'An error occurred during login';
    if (error.message.includes('Invalid login credentials')) message = 'Incorrect email or password';
    return { success: false, message };
  }
  const user = data.user;
  // Fetch user profile/role from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  if (userError || !userData) {
    return { success: false, message: 'User account not properly configured. Please contact administrator.' };
  }
  let redirect = '/student';
  if (userData.role === USER_ROLES.ADMIN) redirect = '/admin';
  else if (userData.role === USER_ROLES.SUPERADMIN) redirect = '/superadmin';
  else if (userData.role === USER_ROLES.ADVISER) redirect = '/adviser';
  return {
    success: true,
    user: {
      uid: user.id,
      email: user.email,
      role: userData.role,
      displayName: user.email,
      needs_password_change: userData.needs_password_change,
      ...userData
    },
    redirect
  };
};

export const registerUser = async (email, password, first_name, surname) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: `${first_name} ${surname}` }
    }
  });
  if (error) {
    let message = 'Registration failed';
    if (error.message.includes('already registered')) message = 'Email already registered';
    return { success: false, message };
  }
  // Insert user profile into users table
  const user = data.user;
  if (user) {
    const { error: insertError } = await supabase.from('users').insert([
      {
        id: user.id,
        email,
        firstName: first_name,
        lastName: surname,
        role: USER_ROLES.STUDENT,
      }
    ]);
    if (insertError) {
      return { success: false, message: 'Failed to create user profile.' };
    }
  }
  return { success: true };
};

export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) {
    return { success: false, message: error.message || 'Failed to send reset email' };
  }
  return { success: true, message: 'Password reset link has been sent to your email.' };
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
};

// Send OTP to email for student login
export const sendOTPToEmail = async (email) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false, // Don't create new users, only send OTP to existing ones
      }
    });

    if (error) {
      console.error('Error sending OTP:', error);
      return { success: false, message: error.message || 'Failed to send OTP' };
    }

    return { success: true, message: 'OTP sent to your email' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
};

// Verify OTP code
export const verifyOTP = async (email, token) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email'
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: error.message || 'Invalid OTP code' };
    }

    // Get user profile data
    const user = data.user;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return { success: false, message: 'User account not properly configured.' };
    }

    let redirect = '/student';
    if (userData.role === USER_ROLES.ADMIN) redirect = '/admin';
    else if (userData.role === USER_ROLES.SUPERADMIN) redirect = '/superadmin';
    else if (userData.role === USER_ROLES.ADVISER) redirect = '/adviser';

    return {
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        role: userData.role,
        displayName: user.email,
        needs_password_change: userData.needs_password_change,
        ...userData
      },
      redirect
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: 'Failed to verify OTP' };
  }
};
