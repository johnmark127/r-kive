import { useState } from 'react'
import { supabase } from '../supabase/client'

/**
 * Custom hook for handling profile picture uploads to Supabase storage
 * Provides validation, compression, upload, and error handling
 */
export const useProfilePictureUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  /**
   * Validates the uploaded file
   * @param {File} file - The file to validate
   * @returns {Object} - {isValid: boolean, error: string}
   */
  const validateFile = (file) => {
    if (!file) {
      return { isValid: false, error: 'No file selected' }
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Please select an image file (PNG, JPG, GIF, etc.)' }
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Image size should be less than 5MB' }
    }

    return { isValid: true, error: null }
  }

  /**
   * Resizes and compresses an image file
   * @param {File} file - The original image file
   * @param {number} maxWidth - Maximum width (default: 200)
   * @param {number} maxHeight - Maximum height (default: 200)
   * @param {number} quality - Compression quality 0-1 (default: 0.8)
   * @returns {Promise<Blob>} - Compressed image blob
   */
  const compressImage = (file, maxWidth = 200, maxHeight = 200, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Uploads profile picture to Supabase storage
   * @param {File} file - The image file to upload
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} - {success: boolean, url: string, error: string}
   */
  const uploadProfilePicture = async (file, userId) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      // Validate file
      const validation = validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      setUploadProgress(25)

      // Compress image
      const compressedBlob = await compressImage(file)
      setUploadProgress(50)

      // Create unique filename
      const timestamp = Date.now()
      const fileExtension = 'jpg' // Always use jpg for compressed images
      const fileName = `${userId}/profile_${timestamp}.${fileExtension}`

      setUploadProgress(75)

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, compressedBlob, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)

      setUploadProgress(100)

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: fileName,
        error: null
      }

    } catch (error) {
      console.error('Error uploading profile picture:', error)
      return {
        success: false,
        url: null,
        fileName: null,
        error: error.message || 'Failed to upload image. Please try again.'
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  /**
   * Removes profile picture from Supabase storage
   * @param {string} fileName - The file name/path in storage
   * @returns {Promise<Object>} - {success: boolean, error: string}
   */
  const removeProfilePicture = async (fileName) => {
    try {
      const { error } = await supabase.storage
        .from('profile-pictures')
        .remove([fileName])

      if (error) {
        throw error
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error removing profile picture:', error)
      return {
        success: false,
        error: error.message || 'Failed to remove image. Please try again.'
      }
    }
  }

  /**
   * Updates user profile picture URL in database
   * @param {string} userId - The user's ID
   * @param {string} profilePictureUrl - The new profile picture URL
   * @returns {Promise<Object>} - {success: boolean, error: string}
   */
  const updateUserProfilePicture = async (userId, profilePictureUrl) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ profile_picture_url: profilePictureUrl })
        .eq('id', userId)

      if (error) {
        throw error
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error updating user profile picture:', error)
      return {
        success: false,
        error: error.message || 'Failed to update profile. Please try again.'
      }
    }
  }

  return {
    uploading,
    uploadProgress,
    uploadProfilePicture,
    removeProfilePicture,
    updateUserProfilePicture,
    validateFile,
    compressImage
  }
}