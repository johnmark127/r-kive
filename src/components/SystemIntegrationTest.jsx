/**
 * R-kive Final Integration Test
 * Run this component to test the complete system integration
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Play,
  Database,
  Users,
  FileText,
  Shield,
  Monitor,
  Link
} from "lucide-react"
import { runSystemHealthCheck, testComponentIntegration } from '../utils/systemHealthCheck'

const SystemIntegrationTest = () => {
  const [testResults, setTestResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTest, setCurrentTest] = useState('')

  const testSuites = [
    { name: 'Database Connectivity', icon: Database, key: 'database' },
    { name: 'Authentication System', icon: Shield, key: 'authentication' },
    { name: 'File Storage', icon: FileText, key: 'fileStorage' },
    { name: 'User Roles', icon: Users, key: 'userRoles' },
    { name: 'Dashboard Integration', icon: Monitor, key: 'dashboards' },
    { name: 'Data Integrity', icon: Link, key: 'dataIntegrity' }
  ]

  const runCompleteTest = async () => {
    setIsRunning(true)
    setProgress(0)
    setTestResults(null)

    try {
      // Simulate progress updates
      const updateProgress = (step, total) => {
        setProgress((step / total) * 100)
        setCurrentTest(`Running test ${step} of ${total}...`)
      }

      // Run system health check
      for (let i = 1; i <= testSuites.length; i++) {
        updateProgress(i, testSuites.length)
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate test time
      }

      setCurrentTest('Generating final report...')
      const results = await runSystemHealthCheck()
      
      setTestResults(results)
      setCurrentTest('Tests completed!')
      setProgress(100)

    } catch (error) {
      console.error('Test execution error:', error)
      setTestResults({
        overallStatus: 'fail',
        criticalIssues: 1,
        results: {
          error: {
            status: 'fail',
            details: [{ test: 'Test execution', status: 'fail', details: error.message }]
          }
        }
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100'
      case 'warn': return 'text-yellow-600 bg-yellow-100'  
      case 'fail': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4" />
      case 'warn': return <AlertTriangle className="w-4 h-4" />
      case 'fail': return <XCircle className="w-4 h-4" />
      default: return <Loader2 className="w-4 h-4 animate-spin" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              🧪 R-kive System Integration Test
            </h1>
            <p className="text-gray-600">Comprehensive system health check and integration verification</p>
          </div>
          <Button 
            onClick={runCompleteTest} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? 'Running Tests...' : 'Run System Test'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{currentTest}</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <>
          {/* Overall Status */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold ${getStatusColor(testResults.overallStatus)}`}>
                  {getStatusIcon(testResults.overallStatus)}
                  Overall System Status: {testResults.overallStatus.toUpperCase()}
                </div>
                <p className="mt-3 text-gray-600">
                  {testResults.overallStatus === 'pass' && '🎉 All systems operational! R-kive is ready for deployment.'}
                  {testResults.overallStatus === 'warn' && '⚠️ System functional with minor issues. Review warnings.'}
                  {testResults.overallStatus === 'fail' && `❌ ${testResults.criticalIssues} critical issue(s) found.`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Test completed at {new Date(testResults.timestamp).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid gap-6">
            {testSuites.map((suite) => {
              const result = testResults.results[suite.key]
              if (!result) return null

              const Icon = suite.icon

              return (
                <Card key={suite.key} className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {suite.name}
                      </CardTitle>
                      <Badge className={getStatusColor(result.status)}>
                        {getStatusIcon(result.status)}
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {result.details && result.details.length > 0 && (
                      <div className="space-y-2">
                        {result.details.map((detail, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              detail.status === 'pass' 
                                ? 'bg-green-50 border-green-200' 
                                : detail.status === 'warn'
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {getStatusIcon(detail.status)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {detail.test || 'Test'}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {detail.details}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Initial State */}
      {!testResults && !isRunning && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready for System Integration Test
              </h3>
              <p className="text-gray-600 mb-6">
                This comprehensive test will verify all system components are properly integrated and working together.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {testSuites.map((suite) => {
                  const Icon = suite.icon
                  return (
                    <div key={suite.key} className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon className="w-4 h-4" />
                      {suite.name}
                    </div>
                  )
                })}
              </div>
              <Button onClick={runCompleteTest} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Integration Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SystemIntegrationTest
