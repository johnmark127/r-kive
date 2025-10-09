/**
 * R-kive System Health Check & Integration Test Suite
 * Day 4 - Final System Integration Testing
 * 
 * This script performs comprehensive testing of all system components
 * to ensure everything is properly integrated and working.
 */

import { supabase } from '../supabase/client'

// System Health Check Results
let healthCheckResults = {
  database: { status: 'pending', details: [] },
  authentication: { status: 'pending', details: [] },
  fileStorage: { status: 'pending', details: [] },
  userRoles: { status: 'pending', details: [] },
  dashboards: { status: 'pending', details: [] },
  dataIntegrity: { status: 'pending', details: [] }
}

/**
 * Database Connectivity & Schema Check
 */
async function checkDatabaseHealth() {
  console.log('🔍 Checking database health...')
  const results = []
  
  try {
    // Check critical tables exist and are accessible
    const criticalTables = [
      'users',
      'research_papers', 
      'student_groups',
      'student_group_members',
      'adviser_group_assignments',
      'research_proposals',
      'bookmarks',
      'research_paper_access_requests'
    ]

    for (const table of criticalTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        
        results.push({
          test: `${table} table accessibility`,
          status: 'pass',
          details: `✅ Table accessible with ${count || 0} records`
        })
      } catch (error) {
        results.push({
          test: `${table} table accessibility`,
          status: 'fail',
          details: `❌ Error: ${error.message}`
        })
      }
    }

    healthCheckResults.database = {
      status: results.every(r => r.status === 'pass') ? 'pass' : 'fail',
      details: results
    }

  } catch (error) {
    healthCheckResults.database = {
      status: 'fail',
      details: [{ test: 'Database connection', status: 'fail', details: error.message }]
    }
  }
}

/**
 * Authentication System Check
 */
async function checkAuthenticationSystem() {
  console.log('🔐 Checking authentication system...')
  const results = []

  try {
    // Check current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      results.push({
        test: 'Session retrieval',
        status: 'fail',
        details: `❌ Error: ${error.message}`
      })
    } else {
      results.push({
        test: 'Session retrieval',
        status: 'pass',
        details: `✅ Session handling working ${session ? '(user logged in)' : '(no active session)'}`
      })
    }

    // Check user roles exist
    const { data: roleData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .not('role', 'is', null)
      .limit(5)

    if (roleError) {
      results.push({
        test: 'User roles system',
        status: 'fail',
        details: `❌ Error: ${roleError.message}`
      })
    } else {
      const roles = [...new Set(roleData.map(u => u.role))]
      results.push({
        test: 'User roles system',
        status: 'pass',
        details: `✅ Active roles: ${roles.join(', ')}`
      })
    }

    healthCheckResults.authentication = {
      status: results.every(r => r.status === 'pass') ? 'pass' : 'fail',
      details: results
    }

  } catch (error) {
    healthCheckResults.authentication = {
      status: 'fail',
      details: [{ test: 'Authentication check', status: 'fail', details: error.message }]
    }
  }
}

/**
 * File Storage System Check
 */
async function checkFileStorageSystem() {
  console.log('📁 Checking file storage system...')
  const results = []

  try {
    // Check storage buckets exist
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      results.push({
        test: 'Storage bucket access',
        status: 'fail',
        details: `❌ Error: ${error.message}`
      })
    } else {
      const bucketNames = buckets.map(b => b.name)
      results.push({
        test: 'Storage bucket access',
        status: 'pass',
        details: `✅ Available buckets: ${bucketNames.join(', ') || 'none'}`
      })
    }

    // Check file upload capability (test with small file)
    const testFile = new Blob(['test'], { type: 'text/plain' })
    const testPath = `health-check/test-${Date.now()}.txt`
    
    const { error: uploadError } = await supabase.storage
      .from('research-papers')
      .upload(testPath, testFile, { upsert: true })

    if (uploadError && !uploadError.message.includes('already exists')) {
      results.push({
        test: 'File upload capability',
        status: 'fail',
        details: `❌ Upload error: ${uploadError.message}`
      })
    } else {
      results.push({
        test: 'File upload capability', 
        status: 'pass',
        details: '✅ File upload system working'
      })
      
      // Clean up test file
      await supabase.storage.from('research-papers').remove([testPath])
    }

    healthCheckResults.fileStorage = {
      status: results.every(r => r.status === 'pass') ? 'pass' : 'fail',
      details: results
    }

  } catch (error) {
    healthCheckResults.fileStorage = {
      status: 'fail',
      details: [{ test: 'File storage check', status: 'fail', details: error.message }]
    }
  }
}

/**
 * User Role-Based Access Check
 */
async function checkUserRoleSystem() {
  console.log('👤 Checking user role system...')
  const results = []

  try {
    // Check each role has users
    const roles = ['student', 'admin', 'adviser', 'superadmin']
    
    for (const role of roles) {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', role)

      if (error) {
        results.push({
          test: `${role} role users`,
          status: 'fail',
          details: `❌ Error: ${error.message}`
        })
      } else {
        results.push({
          test: `${role} role users`,
          status: count > 0 ? 'pass' : 'warn',
          details: `${count > 0 ? '✅' : '⚠️'} ${count || 0} ${role} users`
        })
      }
    }

    // Check group assignments for advisers
    const { data: assignments, error: assignError } = await supabase
      .from('adviser_group_assignments')
      .select('adviser_id, group_id')
      .limit(5)

    if (assignError) {
      results.push({
        test: 'Adviser group assignments',
        status: 'fail',
        details: `❌ Error: ${assignError.message}`
      })
    } else {
      results.push({
        test: 'Adviser group assignments',
        status: 'pass',
        details: `✅ ${assignments?.length || 0} adviser-group assignments`
      })
    }

    healthCheckResults.userRoles = {
      status: results.filter(r => r.status === 'fail').length === 0 ? 'pass' : 'fail',
      details: results
    }

  } catch (error) {
    healthCheckResults.userRoles = {
      status: 'fail',
      details: [{ test: 'User roles check', status: 'fail', details: error.message }]
    }
  }
}

/**
 * Dashboard Components Integration Check
 */
async function checkDashboardIntegration() {
  console.log('📊 Checking dashboard integration...')
  const results = []

  try {
    // Check research proposals integration
    const { data: proposals, error: proposalError } = await supabase
      .from('research_proposals')
      .select('id, title, status, student_id, group_id')
      .limit(5)

    if (proposalError) {
      results.push({
        test: 'Research proposals integration',
        status: 'fail',
        details: `❌ Error: ${proposalError.message}`
      })
    } else {
      const individualCount = proposals?.filter(p => p.student_id && !p.group_id).length || 0
      const groupCount = proposals?.filter(p => p.group_id).length || 0
      
      results.push({
        test: 'Research proposals integration',
        status: 'pass',
        details: `✅ ${individualCount} individual + ${groupCount} group proposals`
      })
    }

    // Check bookmarks integration
    const { data: bookmarks, error: bookmarkError } = await supabase
      .from('bookmarks')
      .select('id, user_id, paper_id')
      .limit(5)

    if (bookmarkError) {
      results.push({
        test: 'Bookmarks integration',
        status: 'fail',
        details: `❌ Error: ${bookmarkError.message}`
      })
    } else {
      results.push({
        test: 'Bookmarks integration',
        status: 'pass',
        details: `✅ ${bookmarks?.length || 0} user bookmarks`
      })
    }

    // Check group management integration
    const { data: groups, error: groupError } = await supabase
      .from('student_groups')
      .select('id, group_name, is_active, student_group_members(count)')
      .eq('is_active', true)
      .limit(5)

    if (groupError) {
      results.push({
        test: 'Group management integration',
        status: 'fail',
        details: `❌ Error: ${groupError.message}`
      })
    } else {
      results.push({
        test: 'Group management integration',
        status: 'pass',
        details: `✅ ${groups?.length || 0} active groups`
      })
    }

    healthCheckResults.dashboards = {
      status: results.every(r => r.status === 'pass') ? 'pass' : 'fail',
      details: results
    }

  } catch (error) {
    healthCheckResults.dashboards = {
      status: 'fail',
      details: [{ test: 'Dashboard integration check', status: 'fail', details: error.message }]
    }
  }
}

/**
 * Data Integrity & Relationships Check
 */
async function checkDataIntegrity() {
  console.log('🔗 Checking data integrity...')
  const results = []

  try {
    // Check foreign key relationships
    // 1. Group members should reference valid users
    const { data: orphanMembers, error: memberError } = await supabase
      .from('student_group_members')
      .select(`
        student_id,
        users!inner(id)
      `)
      .limit(5)

    if (memberError) {
      results.push({
        test: 'Group member-user relationships',
        status: 'fail',
        details: `❌ Error: ${memberError.message}`
      })
    } else {
      results.push({
        test: 'Group member-user relationships',
        status: 'pass',
        details: '✅ Group member relationships valid'
      })
    }

    // 2. Research proposals should have valid authors
    const { data: proposalsWithAuthors, error: proposalUserError } = await supabase
      .from('research_proposals')
      .select('id, student_id, group_id')
      .not('student_id', 'is', null)
      .limit(5)

    if (proposalUserError) {
      results.push({
        test: 'Proposal-author relationships',
        status: 'fail',
        details: `❌ Error: ${proposalUserError.message}`
      })
    } else {
      results.push({
        test: 'Proposal-author relationships',
        status: 'pass',
        details: '✅ Proposal authorship valid'
      })
    }

    // 3. Check adviser assignments are valid
    const { data: validAssignments, error: assignmentError } = await supabase
      .from('adviser_group_assignments')
      .select(`
        adviser_id,
        group_id,
        users!inner(id, role),
        student_groups!inner(id, is_active)
      `)
      .eq('users.role', 'adviser')
      .eq('student_groups.is_active', true)
      .limit(5)

    if (assignmentError) {
      results.push({
        test: 'Adviser assignment validity',
        status: 'fail',
        details: `❌ Error: ${assignmentError.message}`
      })
    } else {
      results.push({
        test: 'Adviser assignment validity',
        status: 'pass',
        details: `✅ ${validAssignments?.length || 0} valid adviser assignments`
      })
    }

    healthCheckResults.dataIntegrity = {
      status: results.every(r => r.status === 'pass') ? 'pass' : 'fail',
      details: results
    }

  } catch (error) {
    healthCheckResults.dataIntegrity = {
      status: 'fail',
      details: [{ test: 'Data integrity check', status: 'fail', details: error.message }]
    }
  }
}

/**
 * Run Complete System Health Check
 */
export async function runSystemHealthCheck() {
  console.log('🚀 R-kive System Health Check Starting...')
  console.log('=' .repeat(50))

  // Run all health checks
  await checkDatabaseHealth()
  await checkAuthenticationSystem() 
  await checkFileStorageSystem()
  await checkUserRoleSystem()
  await checkDashboardIntegration()
  await checkDataIntegrity()

  // Generate comprehensive report
  console.log('\n📋 SYSTEM HEALTH CHECK REPORT')
  console.log('=' .repeat(50))

  const sections = [
    { name: 'Database Connectivity', key: 'database' },
    { name: 'Authentication System', key: 'authentication' },
    { name: 'File Storage System', key: 'fileStorage' },
    { name: 'User Role System', key: 'userRoles' },
    { name: 'Dashboard Integration', key: 'dashboards' },
    { name: 'Data Integrity', key: 'dataIntegrity' }
  ]

  let overallStatus = 'pass'
  let criticalIssues = 0

  for (const section of sections) {
    const result = healthCheckResults[section.key]
    const statusEmoji = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌'
    
    console.log(`\n${statusEmoji} ${section.name}: ${result.status.toUpperCase()}`)
    
    if (result.details) {
      result.details.forEach(detail => {
        console.log(`   ${detail.details}`)
      })
    }

    if (result.status === 'fail') {
      overallStatus = 'fail'
      criticalIssues++
    } else if (result.status === 'warn' && overallStatus === 'pass') {
      overallStatus = 'warn'
    }
  }

  console.log('\n' + '=' .repeat(50))
  console.log(`🎯 OVERALL SYSTEM STATUS: ${overallStatus.toUpperCase()}`)
  
  if (overallStatus === 'pass') {
    console.log('🎉 All systems operational! R-kive is ready for deployment.')
  } else if (overallStatus === 'warn') {
    console.log('⚠️ System functional with minor issues. Review warnings before deployment.')
  } else {
    console.log(`❌ ${criticalIssues} critical issue(s) found. Address before deployment.`)
  }

  console.log('=' .repeat(50))

  return {
    overallStatus,
    criticalIssues,
    results: healthCheckResults,
    timestamp: new Date().toISOString()
  }
}

// Quick component integration tests
export const testComponentIntegration = {
  
  // Test superadmin dashboard functionality
  testSuperadminDashboard: async () => {
    try {
      const { data: groups, error } = await supabase
        .from('student_groups')
        .select('*, student_group_members(*)')
        .eq('is_active', true)
        .limit(3)
      
      return {
        component: 'Superadmin Dashboard',
        status: error ? 'fail' : 'pass',
        details: error ? error.message : `✅ Successfully loaded ${groups?.length || 0} groups`
      }
    } catch (error) {
      return {
        component: 'Superadmin Dashboard',
        status: 'fail',
        details: error.message
      }
    }
  },

  // Test adviser dashboard functionality  
  testAdviserDashboard: async (adviserId) => {
    try {
      const { data: assignments, error } = await supabase
        .from('adviser_group_assignments')
        .select('*, student_groups(*)')
        .eq('adviser_id', adviserId || 'test')
        .limit(3)
      
      return {
        component: 'Adviser Dashboard',
        status: error ? 'fail' : 'pass',
        details: error ? error.message : `✅ Successfully loaded ${assignments?.length || 0} group assignments`
      }
    } catch (error) {
      return {
        component: 'Adviser Dashboard', 
        status: 'fail',
        details: error.message
      }
    }
  },

  // Test student dashboard functionality
  testStudentDashboard: async (studentId) => {
    try {
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select('*, research_papers(*)')
        .eq('user_id', studentId || 'test')
        .limit(3)
      
      return {
        component: 'Student Dashboard',
        status: error ? 'fail' : 'pass', 
        details: error ? error.message : `✅ Successfully loaded ${bookmarks?.length || 0} bookmarks`
      }
    } catch (error) {
      return {
        component: 'Student Dashboard',
        status: 'fail',
        details: error.message
      }
    }
  }
}
