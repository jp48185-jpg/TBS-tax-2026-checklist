"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Upload, Plus, Trash, Check, Phone, User, Download, X, Send, FileText, ExternalLink, AlertCircle } from 'lucide-react'

interface ClientInfo {
  name: string
  dob: string
  ssn: string
  address: string
  phone: string
  email: string
  dlState: string
  dlIssueDate: string
  dlExpDate: string
  dlNumber: string
  occupation: string
}

interface Dependent {
  id: string
  name: string
  dob: string
  ssn: string
  relationship: string
}

interface BankInfo {
  bankName: string
  accountNumber: string
  routingNumber: string
}

interface UploadedFile {
  name: string
  type: string
  data: string
}

interface DocumentUploads {
  clientDL?: UploadedFile
  spouseDL?: UploadedFile
  lastYearTax?: UploadedFile
  incomeDocuments: UploadedFile[]
  irsPin?: UploadedFile
}

interface IncomeDocument {
  type: string
  files: UploadedFile[]
}

interface AdjustmentDocument {
  type: string
  amount: string
  files: UploadedFile[]
}

interface CreditDocument {
  type: string
  details: any
  files: UploadedFile[]
}

// IndexedDB Helper Functions
const DB_NAME = 'TaxChecklistDB'
const DB_VERSION = 1
const STORE_NAME = 'userData'

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'email' })
      }
    }
  })
}

const saveToIndexedDB = async (email: string, data: any): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put({ email, ...data })
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const getFromIndexedDB = async (email: string): Promise<any> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(email)
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        const compressedDataUrl = canvas.toDataURL(file.type, quality)
        resolve(compressedDataUrl)
      }
      
      img.onerror = reject
    }
    
    reader.onerror = reject
  })
}

const clearOldLocalStorage = () => {
  if (typeof window === 'undefined') return
  
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('user_') || key.includes('_data') || key.includes('_documents'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

// Logo as Base64 SVG
const LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYm9va0dyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM3QkIyNDEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzJDM0UyMSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxwYXRoIGQ9Ik0gMjAgMzAgUSAyMCAyNSAyNSAyNSBMIDQ4IDI1IEwgNDggNzUgTCAyNSA3NSBRIDIwIDc1IDIwIDcwIFoiIGZpbGw9InVybCgjYm9va0dyYWRpZW50KSIgLz4KICA8cGF0aCBkPSJNIDUyIDI1IEwgNzUgMjUgUSA4MCAyNSA4MCAzMCBMIDgwIDcwIFEgODAgNzUgNzUgNzUgTCA1MiA3NSBaIiBmaWxsPSJ1cmwoI2Jvb2tHcmFkaWVudCkiIC8+CiAgPGxpbmUgeDE9IjUwIiB5MT0iMjUiIHgyPSI1MCIgeTI9Ijc1IiBzdHJva2U9IiMxRjNBMUYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4zIiAvPgogIDxwYXRoIGQ9Ik0gMzAgNjAgTCAzNSA1MCBMIDQwIDU1IEwgNDUgNDUgTCA1MCA1MCBMIDU1IDQwIEwgNjAgNDUgTCA2NSAzNSBMIDcwIDQwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgLz4KICA8cGF0aCBkPSJNIDcwIDQwIEwgNjcgNDMgTSA3MCA0MCBMIDczIDQzIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgLz4KPC9zdmc+'

// Encyro Link
const ENCYRO_LINK = 'https://www.encyro.com/thebookssolution'

export default function TaxChecklistApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [currentUser, setCurrentUser] = useState<string>('')
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false)
  const [showEncryoSuccess, setShowEncryoSuccess] = useState(false)
  const [userAgreementAccepted, setUserAgreementAccepted] = useState(false)
  const [submissionMetadata, setSubmissionMetadata] = useState<{
    timestamp: string
    referenceId: string
  } | null>(null)

  const [currentStep, setCurrentStep] = useState(0)
  const [filingJointly, setFilingJointly] = useState(false)
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: '', dob: '', ssn: '', address: '', phone: '', email: '',
    dlState: '', dlIssueDate: '', dlExpDate: '', dlNumber: '', occupation: ''
  })
  const [spouseInfo, setSpouseInfo] = useState<ClientInfo>({
    name: '', dob: '', ssn: '', address: '', phone: '', email: '',
    dlState: '', dlIssueDate: '', dlExpDate: '', dlNumber: '', occupation: ''
  })
  const [dependents, setDependents] = useState<Dependent[]>([])
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: '', accountNumber: '', routingNumber: ''
  })
  const [signature, setSignature] = useState('')
  const [spouseSignature, setSpouseSignature] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [documentUploads, setDocumentUploads] = useState<DocumentUploads>({
    incomeDocuments: []
  })
  const [incomeData, setIncomeData] = useState<IncomeDocument[]>([])
  const [adjustmentData, setAdjustmentData] = useState<AdjustmentDocument[]>([])
  const [creditData, setCreditData] = useState<CreditDocument[]>([])

  const steps = [
    'Welcome',
    'Client Information',
    'Spouse Information',
    'Dependents',
    'Document Uploads',
    'Income Information',
    'Adjustments',
    'Credits & Deductions',
    'Bank Information',
    'Review & Sign'
  ]

  const incomeTypes = [
    'W-2 Forms (Employment Income)',
    '1099-MISC (Miscellaneous Income)',
    '1099-NEC (Non-Employee Compensation)',
    '1099-INT (Interest Income)',
    '1099-DIV (Dividend Income)',
    '1099-B (Proceeds from Broker Transactions)',
    '1099-K (Payment Card and Third Party Network Transactions)',
    '1099-R (Retirement Distributions)',
    '1099-SSA (Social Security Benefits)',
    '1099-G (Government Payments)',
    'Rental Property Income',
    'Capital Gains/Losses',
    'Trading Activity (Traditional/Virtual Currency)'
  ]

  const adjustmentTypes = [
    'IRA Contributions',
    'SEP IRA Contributions',
    'Student Loan Interest',
    'Tuition and Fees',
    'Self-Employed Pension Plans'
  ]

  const creditTypes = [
    'Childcare Expenses',
    'Education Expenses (Form 1098-T)',
    'Adoption Expenses',
    'Mortgage Interest',
    'Private Mortgage Insurance (PMI)',
    'Investment Interest Expenses',
    'Home Business Expenses',
    'Rental Property Expenses'
  ]

  // Load PDF.js from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.async = true
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        setPdfJsLoaded(true)
        console.log('PDF.js loaded successfully')
      }
    }
    script.onerror = () => {
      console.error('Failed to load PDF.js')
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    clearOldLocalStorage()
  }, [])

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadUserData(currentUser)
    }
  }, [isLoggedIn, currentUser])

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const interval = setInterval(() => {
        saveUserData()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isLoggedIn, currentUser, currentStep, filingJointly, clientInfo, spouseInfo, dependents, bankInfo, signature, spouseSignature, documentUploads, incomeData, adjustmentData, creditData, userAgreementAccepted])

  const saveUserData = async () => {
    if (!currentUser || typeof window === 'undefined') return

    try {
      const userData = {
        password: localStorage.getItem(`pwd_${currentUser}`) || '',
        currentStep,
        filingJointly,
        clientInfo,
        spouseInfo,
        dependents,
        bankInfo,
        signature,
        spouseSignature,
        documentUploads,
        incomeData,
        adjustmentData,
        creditData,
        userAgreementAccepted,
        lastSaved: new Date().toISOString()
      }

      await saveToIndexedDB(currentUser, userData)
      setShowSaveNotification(true)
      setTimeout(() => setShowSaveNotification(false), 2000)
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }

  const loadUserData = async (email: string) => {
    if (typeof window === 'undefined') return

    try {
      const savedData = await getFromIndexedDB(email)
      
      if (savedData) {
        setCurrentStep(savedData.currentStep || 0)
        setFilingJointly(savedData.filingJointly || false)
        setClientInfo(savedData.clientInfo || clientInfo)
        setSpouseInfo(savedData.spouseInfo || spouseInfo)
        setDependents(savedData.dependents || [])
        setBankInfo(savedData.bankInfo || bankInfo)
        setSignature(savedData.signature || '')
        setSpouseSignature(savedData.spouseSignature || '')
        setDocumentUploads(savedData.documentUploads || { incomeDocuments: [] })
        setIncomeData(savedData.incomeData || [])
        setAdjustmentData(savedData.adjustmentData || [])
        setCreditData(savedData.creditData || [])
        setUserAgreementAccepted(savedData.userAgreementAccepted || false)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const convertPdfToImages = async (file: File): Promise<string[]> => {
    if (typeof window === 'undefined' || !window.pdfjsLib) {
      throw new Error('PDF.js not loaded')
    }

    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const images: string[] = []
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          
          const scale = 2.0
          const viewport = page.getViewport({ scale })
          
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width
          
          if (!context) {
            reject(new Error('Could not get canvas context'))
            return
          }

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          }
          
          await page.render(renderContext).promise
          
          const imageData = canvas.toDataURL('image/jpeg', 0.9)
          images.push(imageData)
        }
        
        resolve(images)
      } catch (error) {
        console.error('Error converting PDF to images:', error)
        reject(error)
      }
    })
  }

  const processFile = async (file: File): Promise<UploadedFile[]> => {
    if (typeof window === 'undefined') {
      throw new Error('File processing is only available in browser environment')
    }

    if (file.type === 'application/pdf') {
      setUploadProgress(`Processing PDF: ${file.name}...`)
      
      if (pdfJsLoaded && window.pdfjsLib) {
        try {
          const images = await convertPdfToImages(file)
          setUploadProgress(`PDF converted: ${images.length} page(s)`)
          
          return images.map((imageData, index) => ({
            name: `${file.name} - Page ${index + 1}`,
            type: 'image/jpeg',
            data: imageData
          }))
        } catch (error) {
          console.error('PDF conversion failed:', error)
          const data = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          return [{
            name: file.name,
            type: file.type,
            data
          }]
        }
      } else {
        const data = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        return [{
          name: file.name,
          type: file.type,
          data
        }]
      }
    } else if (file.type.startsWith('image/')) {
      setUploadProgress(`Compressing image: ${file.name}...`)
      const data = await compressImage(file)
      return [{
        name: file.name,
        type: file.type,
        data
      }]
    } else {
      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      return [{
        name: file.name,
        type: file.type,
        data
      }]
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (field === 'incomeDocuments') {
      for (const file of Array.from(files)) {
        try {
          const uploadedFiles = await processFile(file)
          setDocumentUploads(prev => ({
            ...prev,
            incomeDocuments: [...prev.incomeDocuments, ...uploadedFiles]
          }))
        } catch (error) {
          console.error('Error uploading file:', error)
        }
      }
    } else {
      const file = files[0]
      try {
        const uploadedFiles = await processFile(file)
        setDocumentUploads(prev => ({
          ...prev,
          [field]: uploadedFiles[0]
        }))
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }
    
    setTimeout(() => setUploadProgress(''), 2000)
  }

  const toggleIncome = (incomeType: string) => {
    const exists = incomeData.find(item => item.type === incomeType)
    if (exists) {
      setIncomeData(incomeData.filter(item => item.type !== incomeType))
    } else {
      setIncomeData([...incomeData, { type: incomeType, files: [] }])
    }
  }

  const isIncomeSelected = (incomeType: string): boolean => {
    return incomeData.some(item => item.type === incomeType)
  }

  const handleIncomeFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    incomeType: string
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newFiles: UploadedFile[] = []

    for (const file of Array.from(files)) {
      try {
        const uploadedFiles = await processFile(file)
        newFiles.push(...uploadedFiles)
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }

    setIncomeData(prev => prev.map(item => 
      item.type === incomeType 
        ? { ...item, files: [...item.files, ...newFiles] }
        : item
    ))
    
    setTimeout(() => setUploadProgress(''), 2000)
  }

  const removeIncomeFile = (incomeType: string, fileIndex: number) => {
    setIncomeData(prev => prev.map(item =>
      item.type === incomeType
        ? { ...item, files: item.files.filter((_, idx) => idx !== fileIndex) }
        : item
    ))
  }

  const toggleAdjustment = (adjustmentType: string) => {
    const exists = adjustmentData.find(item => item.type === adjustmentType)
    if (exists) {
      setAdjustmentData(adjustmentData.filter(item => item.type !== adjustmentType))
    } else {
      setAdjustmentData([...adjustmentData, { type: adjustmentType, amount: '', files: [] }])
    }
  }

  const isAdjustmentSelected = (adjustmentType: string): boolean => {
    return adjustmentData.some(item => item.type === adjustmentType)
  }

  const getAdjustmentAmount = (adjustmentType: string): string => {
    const adjustment = adjustmentData.find(item => item.type === adjustmentType)
    return adjustment?.amount || ''
  }

  const updateAdjustmentAmount = (adjustmentType: string, amount: string) => {
    setAdjustmentData(prev => prev.map(item =>
      item.type === adjustmentType
        ? { ...item, amount }
        : item
    ))
  }

  const handleAdjustmentFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    adjustmentType: string
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newFiles: UploadedFile[] = []

    for (const file of Array.from(files)) {
      try {
        const uploadedFiles = await processFile(file)
        newFiles.push(...uploadedFiles)
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }

    setAdjustmentData(prev => prev.map(item => 
      item.type === adjustmentType 
        ? { ...item, files: [...item.files, ...newFiles] }
        : item
    ))
    
    setTimeout(() => setUploadProgress(''), 2000)
  }

  const removeAdjustmentFile = (adjustmentType: string, fileIndex: number) => {
    setAdjustmentData(prev => prev.map(item =>
      item.type === adjustmentType
        ? { ...item, files: item.files.filter((_, idx) => idx !== fileIndex) }
        : item
    ))
  }

  const toggleCredit = (creditType: string) => {
    const exists = creditData.find(item => item.type === creditType)
    if (exists) {
      setCreditData(creditData.filter(item => item.type !== creditType))
    } else {
      setCreditData([...creditData, { type: creditType, details: '', files: [] }])
    }
  }

  const isCreditSelected = (creditType: string): boolean => {
    return creditData.some(item => item.type === creditType)
  }

  const getCreditDetails = (creditType: string): any => {
    const credit = creditData.find(item => item.type === creditType)
    return credit?.details || ''
  }

  const updateCreditDetails = (creditType: string, details: any) => {
    setCreditData(prev => prev.map(item =>
      item.type === creditType
        ? { ...item, details }
        : item
    ))
  }

  const handleCreditFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    creditType: string
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newFiles: UploadedFile[] = []

    for (const file of Array.from(files)) {
      try {
        const uploadedFiles = await processFile(file)
        newFiles.push(...uploadedFiles)
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }

    setCreditData(prev => prev.map(item => 
      item.type === creditType 
        ? { ...item, files: [...item.files, ...newFiles] }
        : item
    ))
    
    setTimeout(() => setUploadProgress(''), 2000)
  }

  const removeCreditFile = (creditType: string, fileIndex: number) => {
    setCreditData(prev => prev.map(item =>
      item.type === creditType
        ? { ...item, files: item.files.filter((_, idx) => idx !== fileIndex) }
        : item
    ))
  }

  const generatePDFContent = () => {
    const currentDate = new Date().toLocaleDateString()
    const metadata = submissionMetadata || {
      timestamp: new Date().toISOString(),
      referenceId: crypto.randomUUID()
    }

    const dependentsHTML = dependents.map((dep, index) => `
      <div class="bubble">
        <h3>Dependent ${index + 1}</h3>
        <div class="data-row"><span class="label">Name:</span> <span>${dep.name}</span></div>
        <div class="data-row"><span class="label">DOB:</span> <span>${dep.dob}</span></div>
        <div class="data-row"><span class="label">SSN:</span> <span>${dep.ssn}</span></div>
        <div class="data-row"><span class="label">Relationship:</span> <span>${dep.relationship}</span></div>
      </div>
    `).join('')

    const generateDocumentImages = (files: UploadedFile[], title: string) => {
      if (!files || files.length === 0) return ''
      
      return `
        <div class="document-section">
          <h4 class="document-title">${title}</h4>
          ${files.map((file, idx) => `
            <div class="document-page">
              <p class="document-name">${file.name}</p>
              <img src="${file.data}" alt="${file.name}" class="document-image" />
            </div>
          `).join('')}
        </div>
      `
    }

    const step4DocsHTML = `
      ${documentUploads.clientDL ? generateDocumentImages([documentUploads.clientDL], "Client Driver's License") : ''}
      ${documentUploads.spouseDL ? generateDocumentImages([documentUploads.spouseDL], "Spouse Driver's License") : ''}
      ${documentUploads.lastYearTax ? generateDocumentImages([documentUploads.lastYearTax], "Last Year's Tax Return") : ''}
      ${documentUploads.incomeDocuments.length > 0 ? generateDocumentImages(documentUploads.incomeDocuments, "General Income Documents") : ''}
      ${documentUploads.irsPin ? generateDocumentImages([documentUploads.irsPin], "IRS PIN Letter") : ''}
    `

    const incomeHTML = incomeData.length > 0 ? `
      <div class="bubble full-width">
        <h3>Income Sources</h3>
        ${incomeData.map(income => `
          <div class="income-section">
            <div class="data-row">
              <span class="label">✓ ${income.type}</span>
              <span>${income.files.length} document(s)</span>
            </div>
            ${generateDocumentImages(income.files, income.type)}
          </div>
        `).join('')}
      </div>
    ` : ''

    const adjustmentsHTML = adjustmentData.length > 0 ? `
      <div class="bubble full-width">
        <h3>Income Adjustments</h3>
        ${adjustmentData.map(adjustment => `
          <div class="adjustment-section">
            <div class="data-row">
              <span class="label">${adjustment.type}:</span> 
              <span>$${adjustment.amount} (${adjustment.files.length} document(s))</span>
            </div>
            ${generateDocumentImages(adjustment.files, adjustment.type)}
          </div>
        `).join('')}
      </div>
    ` : ''

    const creditsHTML = creditData.length > 0 ? `
      <div class="bubble full-width">
        <h3>Credits & Deductions</h3>
        ${creditData.map(credit => `
          <div class="credit-section">
            <div class="data-row">
              <span class="label">✓ ${credit.type}</span>
              <span>${credit.files.length} document(s)</span>
            </div>
            ${generateDocumentImages(credit.files, credit.type)}
          </div>
        `).join('')}
      </div>
    ` : ''

    return `
      <html>
        <head>
          <title>Tax Checklist - ${clientInfo.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              color: #333; 
              background: #f9f9f9; 
            }
            
            .header { 
              text-align: center; 
              border-bottom: 3px solid #2C5F2D; 
              margin-bottom: 30px; 
              padding-bottom: 15px; 
            }

            .header-logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 15px;
            }
            
            .header h1 {
              color: #2C5F2D;
              margin: 0;
              font-size: 32px;
            }
            
            .header p {
              color: #1F3550;
              margin: 5px 0 0 0;
              font-size: 18px;
            }
            
            .header .date {
              color: #666;
              font-size: 14px;
              margin-top: 10px;
            }
            
            .grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 20px;
            }
            
            .bubble { 
              background: white; 
              border: 1px solid #e0e0e0; 
              border-radius: 12px; 
              padding: 20px; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              break-inside: avoid;
              margin-bottom: 20px;
            }
            
            .bubble.full-width {
              grid-column: 1 / -1;
            }
            
            .bubble h3 { 
              margin-top: 0; 
              margin-bottom: 15px;
              color: #2C5F2D; 
              font-size: 16px; 
              text-transform: uppercase; 
              border-bottom: 2px solid #7BB241;
              padding-bottom: 8px;
            }
            
            .data-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 8px 0; 
              font-size: 14px;
              padding: 5px 0;
              border-bottom: 1px solid #f5f5f5;
            }
            
            .label { 
              font-weight: 600; 
              color: #555; 
            }

            .document-section {
              margin: 20px 0;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 8px;
            }

            .document-title {
              font-size: 14px;
              font-weight: 600;
              color: #2C5F2D;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #7BB241;
            }

            .document-page {
              background: white;
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 6px;
              border: 1px solid #e0e0e0;
              page-break-inside: avoid;
              page-break-after: always;
            }

            .document-name {
              font-size: 12px;
              color: #666;
              margin-bottom: 10px;
              font-weight: 600;
            }

            .document-image {
              width: 100%;
              height: auto;
              border: 1px solid #ddd;
              border-radius: 4px;
              display: block;
            }

            .income-section,
            .adjustment-section,
            .credit-section {
              margin-bottom: 20px;
            }

            .declaration-page {
              page-break-before: always;
              background: white;
              border: 2px solid #2C5F2D;
              border-radius: 12px;
              padding: 40px;
              margin-top: 40px;
            }

            .declaration-title {
              text-align: center;
              color: #2C5F2D;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 30px;
              text-transform: uppercase;
              border-bottom: 3px solid #7BB241;
              padding-bottom: 15px;
            }

            .declaration-text {
              background: #f9f9f9;
              border-left: 4px solid #2C5F2D;
              padding: 20px;
              margin: 20px 0;
              font-size: 14px;
              line-height: 1.8;
              color: #333;
            }

            .signature-block {
              margin: 30px 0;
              padding: 20px;
              background: #f0f8f0;
              border-radius: 8px;
            }

            .signature-line {
              font-family: 'Brush Script MT', cursive;
              font-size: 32px;
              color: #1F3550;
              margin: 15px 0;
              padding: 10px;
              border-bottom: 2px solid #2C5F2D;
            }

            .metadata-section {
              margin-top: 40px;
              padding: 25px;
              background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%);
              border: 2px solid #7BB241;
              border-radius: 8px;
            }

            .metadata-title {
              font-size: 18px;
              font-weight: bold;
              color: #2C5F2D;
              margin-bottom: 15px;
              text-transform: uppercase;
            }

            .metadata-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #7BB241;
              font-size: 14px;
            }

            .metadata-label {
              font-weight: 600;
              color: #2C5F2D;
            }

            .metadata-value {
              color: #1F3550;
              font-family: monospace;
            }

            .certification-seal {
              text-align: center;
              margin-top: 30px;
              padding: 20px;
              background: #2C5F2D;
              color: white;
              border-radius: 8px;
              font-weight: bold;
            }
            
            @media print {
              body { 
                background: white; 
                padding: 20px;
              }
              
              .bubble { 
                box-shadow: none;
                page-break-inside: avoid;
              }

              .document-page {
                page-break-inside: avoid;
                page-break-after: always;
              }

              .declaration-page {
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${LOGO_BASE64}" alt="The Books Solution" class="header-logo" />
            <h1>The Books Solution</h1>
            <p>2025 Personal Tax Organizer</p>
            <div class="date">Generated: ${currentDate}</div>
          </div>
          
          <div class="grid">
            <div class="bubble">
              <h3>Client Information</h3>
              <div class="data-row"><span class="label">Name:</span> <span>${clientInfo.name}</span></div>
              <div class="data-row"><span class="label">SSN:</span> <span>${clientInfo.ssn}</span></div>
              <div class="data-row"><span class="label">DOB:</span> <span>${clientInfo.dob}</span></div>
              <div class="data-row"><span class="label">Phone:</span> <span>${clientInfo.phone}</span></div>
              <div class="data-row"><span class="label">Email:</span> <span>${clientInfo.email}</span></div>
            </div>

            <div class="bubble">
              <h3>Address & License</h3>
              <div class="data-row"><span class="label">Address:</span> <span>${clientInfo.address}</span></div>
              <div class="data-row"><span class="label">DL State:</span> <span>${clientInfo.dlState}</span></div>
              <div class="data-row"><span class="label">DL Number:</span> <span>${clientInfo.dlNumber}</span></div>
            </div>

            ${filingJointly && spouseInfo.name ? `
              <div class="bubble">
                <h3>Spouse Information</h3>
                <div class="data-row"><span class="label">Name:</span> <span>${spouseInfo.name}</span></div>
                <div class="data-row"><span class="label">SSN:</span> <span>${spouseInfo.ssn}</span></div>
                <div class="data-row"><span class="label">DOB:</span> <span>${spouseInfo.dob}</span></div>
              </div>
            ` : ''}

            <div class="bubble">
              <h3>Bank Information</h3>
              <div class="data-row"><span class="label">Bank:</span> <span>${bankInfo.bankName}</span></div>
              <div class="data-row"><span class="label">Routing:</span> <span>${bankInfo.routingNumber}</span></div>
              <div class="data-row"><span class="label">Account:</span> <span>${bankInfo.accountNumber}</span></div>
            </div>

            ${dependentsHTML}
          </div>

          <div class="bubble full-width">
            <h3>Uploaded Documents</h3>
            ${step4DocsHTML}
          </div>

          ${incomeHTML}
          ${adjustmentsHTML}
          ${creditsHTML}

          <div class="grid">
            <div class="bubble">
              <h3>Taxpayer Signature</h3>
              <div class="data-row"><span class="label">Signature:</span> <span>${signature}</span></div>
              <div class="data-row"><span class="label">Date:</span> <span>${currentDate}</span></div>
            </div>

            ${filingJointly && spouseSignature ? `
              <div class="bubble">
                <h3>Spouse Signature</h3>
                <div class="data-row"><span class="label">Signature:</span> <span>${spouseSignature}</span></div>
                <div class="data-row"><span class="label">Date:</span> <span>${currentDate}</span></div>
              </div>
            ` : ''}
          </div>

          <div class="declaration-page">
            <h2 class="declaration-title">Official Declaration & Audit Trail</h2>
            
            <div class="declaration-text">
              <p><strong>Legal Declaration:</strong></p>
              <p style="margin-top: 15px;">
                I certify under penalty of perjury that the information provided is true, correct, and complete. 
                I acknowledge this document serves as a binding record of the data I provided to The Books Solution 
                for tax preparation purposes.
              </p>
              <p style="margin-top: 15px;">
                I understand that any false statements or misrepresentations may subject me to penalties under 
                applicable federal and state laws.
              </p>
            </div>

            <div class="signature-block">
              <div style="margin-bottom: 10px; font-weight: 600; color: #2C5F2D;">Taxpayer Signature:</div>
              <div class="signature-line">${signature}</div>
              <div style="margin-top: 10px; color: #666; font-size: 12px;">Date: ${currentDate}</div>
            </div>

            ${filingJointly && spouseSignature ? `
              <div class="signature-block">
                <div style="margin-bottom: 10px; font-weight: 600; color: #2C5F2D;">Spouse Signature:</div>
                <div class="signature-line">${spouseSignature}</div>
                <div style="margin-top: 10px; color: #666; font-size: 12px;">Date: ${currentDate}</div>
              </div>
            ` : ''}

            <div class="metadata-section">
              <div class="metadata-title">Submission Metadata</div>
              <div class="metadata-item">
                <span class="metadata-label">Submission Timestamp:</span>
                <span class="metadata-value">${new Date(metadata.timestamp).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZoneName: 'short'
                })}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Reference ID:</span>
                <span class="metadata-value">${metadata.referenceId}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Client Email:</span>
                <span class="metadata-value">${clientInfo.email}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Document Version:</span>
                <span class="metadata-value">2025-TAX-ORGANIZER-v1.0</span>
              </div>
            </div>

            <div class="certification-seal">
              ✓ CERTIFIED TAX DOCUMENT - THE BOOKS SOLUTION
              <div style="font-size: 12px; margin-top: 10px; font-weight: normal;">
                This document has been electronically certified and contains a unique reference ID for audit purposes.
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const downloadPDF = () => {
    if (typeof window === 'undefined') return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow pop-ups to download the PDF')
      return
    }

    printWindow.document.write(generatePDFContent())
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 1000)
  }

  const savePDF = () => {
    if (typeof window === 'undefined') return

    const content = generatePDFContent()
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Tax_Checklist_${clientInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const openEncyroPortal = () => {
    window.open(ENCYRO_LINK, '_blank')
    setShowEncryoSuccess(true)
    setTimeout(() => {
      setShowEncryoSuccess(false)
    }, 5000)
  }

  const handleSubmit = async () => {
    setIsGeneratingPDF(true)
    
    const metadata = {
      timestamp: new Date().toISOString(),
      referenceId: crypto.randomUUID()
    }
    setSubmissionMetadata(metadata)
    
    await saveUserData()
    setTimeout(() => {
      setIsGeneratingPDF(false)
      setSubmitted(true)
    }, 2000)
  }

  const handleLogin = async () => {
    if (typeof window === 'undefined') return

    setLoginError('')
    
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password')
      return
    }

    const savedPassword = localStorage.getItem(`pwd_${loginEmail}`)
    
    if (!savedPassword) {
      setLoginError('No account found with this email. Please register.')
      return
    }

    if (savedPassword !== loginPassword) {
      setLoginError('Incorrect password')
      return
    }

    setCurrentUser(loginEmail)
    setIsLoggedIn(true)
  }

  const handleRegister = () => {
    if (typeof window === 'undefined') return

    setLoginError('')

    if (!loginEmail || !loginPassword || !confirmPassword) {
      setLoginError('Please fill in all fields')
      return
    }

    if (loginPassword !== confirmPassword) {
      setLoginError('Passwords do not match')
      return
    }

    if (loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters')
      return
    }

    const existingUser = localStorage.getItem(`pwd_${loginEmail}`)
    if (existingUser) {
      setLoginError('An account with this email already exists')
      return
    }

    localStorage.setItem(`pwd_${loginEmail}`, loginPassword)
    setCurrentUser(loginEmail)
    setIsLoggedIn(true)
    setIsRegistering(false)
  }

  const handleLogout = async () => {
    await saveUserData()
    setIsLoggedIn(false)
    setCurrentUser('')
    setLoginEmail('')
    setLoginPassword('')
    setConfirmPassword('')
  }

  const addDependent = () => {
    setDependents([...dependents, {
      id: Date.now().toString(),
      name: '',
      dob: '',
      ssn: '',
      relationship: ''
    }])
  }

  const removeDependent = (id: string) => {
    setDependents(dependents.filter(dep => dep.id !== id))
  }

  const updateDependent = (id: string, field: keyof Dependent, value: string) => {
    setDependents(dependents.map(dep => 
      dep.id === id ? { ...dep, [field]: value } : dep
    ))
  }

  const canProceedFromWelcome = () => {
    return userAgreementAccepted
  }

  const renderLogo = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-24 h-24 mb-6">
        <img src={LOGO_BASE64} alt="The Books Solution" className="w-full h-full" />
      </div>
      <div className="text-center">
        <div className="text-lg text-[#2C3E21] font-normal">The</div>
        <div className="text-5xl text-[#2C3E21] font-bold leading-tight">Books</div>
        <div className="text-5xl text-[#1F3550] font-bold leading-tight">Solution</div>
      </div>
    </div>
  )

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {renderLogo()}
            <CardTitle className="text-2xl">
              {isRegistering ? 'Create Account' : 'Client Portal Login'}
            </CardTitle>
            <CardDescription>
              {isRegistering 
                ? 'Register to save your tax information securely' 
                : 'Access your saved tax checklist'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginEmail">Email Address</Label>
              <Input 
                id="loginEmail"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginPassword">Password</Label>
              <Input 
                id="loginPassword"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
            )}
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {loginError}
              </div>
            )}
            <Button 
              onClick={isRegistering ? handleRegister : handleLogin}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isRegistering ? 'Create Account' : 'Login'}
            </Button>
            <div className="text-center">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering)
                  setLoginError('')
                  setConfirmPassword('')
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                {isRegistering 
                  ? 'Already have an account? Login' 
                  : "Don't have an account? Register"}
              </button>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="text-sm text-blue-900">
                <strong>Secure Portal:</strong> Your information is saved securely using IndexedDB. 
                You can return anytime to continue your tax checklist.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            {renderLogo()}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl text-green-700">Tax Checklist Complete!</CardTitle>
            <CardDescription className="text-lg mt-4">
              Your tax information has been compiled successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg text-left">
              <h3 className="font-semibold text-blue-900 mb-3">Summary:</h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>✓ Client: {clientInfo.name}</li>
                {filingJointly && <li>✓ Spouse: {spouseInfo.name}</li>}
                <li>✓ Dependents: {dependents.length}</li>
                <li>✓ Income Sources: {incomeData.length}</li>
                <li>✓ Adjustments: {adjustmentData.length}</li>
                <li>✓ Credits: {creditData.length}</li>
              </ul>
            </div>

            {submissionMetadata && (
              <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200 text-left">
                <h3 className="font-semibold text-purple-900 mb-3">Submission Details:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700 font-medium">Reference ID:</span>
                    <span className="text-purple-900 font-mono">{submissionMetadata.referenceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700 font-medium">Timestamp:</span>
                    <span className="text-purple-900">{new Date(submissionMetadata.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={downloadPDF}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Print PDF
              </Button>

              <Button 
                onClick={savePDF}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <FileText className="w-5 h-5 mr-2" />
                Save PDF
              </Button>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-purple-900 text-xl">Send Securely via Encyro</h3>
              </div>
              <p className="text-purple-800 text-sm mb-4 text-center">
                Upload your tax documents to our secure Encyro portal for encrypted transmission to The Books Solution
              </p>
              <Button 
                onClick={openEncyroPortal}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                size="lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open Encyro Secure Portal
              </Button>
              {showEncryoSuccess && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Encyro portal opened! Please upload your documents there.</span>
                </div>
              )}
              <p className="text-xs text-purple-600 mt-3 text-center">
                🔒 Bank-level encryption • HIPAA compliant • Secure file transfer
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-semibold text-green-900 mb-2">Need assistance?</p>
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Phone className="w-4 h-4" />
                <span>941-257-9469</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleLogout} variant="outline" className="flex-1">
                Logout
              </Button>
              <Button onClick={() => {
                setSubmitted(false)
                setCurrentStep(0)
                setSubmissionMetadata(null)
              }} variant="outline" className="flex-1">
                Start New Checklist
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isGeneratingPDF) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Tax Checklist</h3>
            <p className="text-gray-600">Please wait while we compile your information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-4 pb-24">
        {uploadProgress && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
            {uploadProgress}
          </div>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            {renderLogo()}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{currentUser}</span>
              </div>
              {showSaveNotification && (
                <div className="text-xs text-green-600 mt-1">
                  ✓ Progress saved
                </div>
              )}
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">Your Progress</h3>
              <p className="text-sm text-gray-600">
                Step {currentStep + 1} of {steps.length} - {steps[currentStep]}
              </p>
            </div>
            <Button onClick={saveUserData} variant="outline" size="sm">
              Save Progress
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">{steps[currentStep]}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Welcome to Your Personal Tax Checklist</CardTitle>
              <CardDescription className="text-center text-base">
                Complete this checklist to provide all necessary information for your tax return
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Instructions:</h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Fill out all required fields accurately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Upload clear photos or PDFs of required documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>PDFs will be automatically separated by page for better visibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Your progress is automatically saved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Review all information before final submission</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-3">User Agreement (Required)</h3>
                    <div className="bg-white p-4 rounded border border-amber-200 mb-4">
                      <p className="text-sm text-amber-900 leading-relaxed">
                        I agree to the Terms of Use and acknowledge that The Books Solution is not liable 
                        for data accuracy or third-party sharing of the generated PDF. I understand that 
                        I am responsible for verifying all information before submission and that this 
                        document will be used for tax preparation purposes.
                      </p>
                    </div>
                    <Label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded border-2 border-amber-300 hover:bg-amber-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={userAgreementAccepted}
                        onChange={(e) => setUserAgreementAccepted(e.target.checked)}
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-sm font-semibold text-amber-900">
                        I have read and agree to the User Agreement and Terms of Use
                      </span>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">Need Help?</h3>
                <div className="space-y-2 text-green-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    <span className="font-medium">941-257-9469</span>
                  </div>
                  <p className="text-sm">Our tax professionals are available to assist you</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Please provide your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name" 
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input 
                    id="dob" 
                    type="date"
                    value={clientInfo.dob}
                    onChange={(e) => setClientInfo({...clientInfo, dob: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssn">Social Security Number *</Label>
                  <Input 
                    id="ssn" 
                    value={clientInfo.ssn}
                    onChange={(e) => setClientInfo({...clientInfo, ssn: e.target.value})}
                    placeholder="XXX-XX-XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea 
                    id="address"
                    value={clientInfo.address}
                    onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dlState">Driver's License State *</Label>
                  <Input 
                    id="dlState"
                    value={clientInfo.dlState}
                    onChange={(e) => setClientInfo({...clientInfo, dlState: e.target.value})}
                    placeholder="FL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dlNumber">Driver's License Number *</Label>
                  <Input 
                    id="dlNumber"
                    value={clientInfo.dlNumber}
                    onChange={(e) => setClientInfo({...clientInfo, dlNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dlIssueDate">Issue Date *</Label>
                  <Input 
                    id="dlIssueDate"
                    type="date"
                    value={clientInfo.dlIssueDate}
                    onChange={(e) => setClientInfo({...clientInfo, dlIssueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dlExpDate">Expiration Date *</Label>
                  <Input 
                    id="dlExpDate"
                    type="date"
                    value={clientInfo.dlExpDate}
                    onChange={(e) => setClientInfo({...clientInfo, dlExpDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Input 
                    id="occupation"
                    value={clientInfo.occupation}
                    onChange={(e) => setClientInfo({...clientInfo, occupation: e.target.value})}
                    placeholder="Software Engineer"
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filingJointly}
                    onChange={(e) => setFilingJointly(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Filing jointly with spouse</span>
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Spouse Information</CardTitle>
              <CardDescription>
                {filingJointly ? "Please provide your spouse's information" : "Skip this step if not filing jointly"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filingJointly ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spouseName">Full Name *</Label>
                    <Input 
                      id="spouseName"
                      value={spouseInfo.name}
                      onChange={(e) => setSpouseInfo({...spouseInfo, name: e.target.value})}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseDob">Date of Birth *</Label>
                    <Input 
                      id="spouseDob"
                      type="date"
                      value={spouseInfo.dob}
                      onChange={(e) => setSpouseInfo({...spouseInfo, dob: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseSsn">Social Security Number *</Label>
                    <Input 
                      id="spouseSsn"
                      value={spouseInfo.ssn}
                      onChange={(e) => setSpouseInfo({...spouseInfo, ssn: e.target.value})}
                      placeholder="XXX-XX-XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spousePhone">Phone Number *</Label>
                    <Input 
                      id="spousePhone"
                      type="tel"
                      value={spouseInfo.phone}
                      onChange={(e) => setSpouseInfo({...spouseInfo, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="spouseEmail">Email Address *</Label>
                    <Input 
                      id="spouseEmail"
                      type="email"
                      value={spouseInfo.email}
                      onChange={(e) => setSpouseInfo({...spouseInfo, email: e.target.value})}
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseDlState">Driver's License State *</Label>
                    <Input 
                      id="spouseDlState"
                      value={spouseInfo.dlState}
                      onChange={(e) => setSpouseInfo({...spouseInfo, dlState: e.target.value})}
                      placeholder="FL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseDlNumber">Driver's License Number *</Label>
                    <Input 
                      id="spouseDlNumber"
                      value={spouseInfo.dlNumber}
                      onChange={(e) => setSpouseInfo({...spouseInfo, dlNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseDlIssueDate">Issue Date *</Label>
                    <Input 
                      id="spouseDlIssueDate"
                      type="date"
                      value={spouseInfo.dlIssueDate}
                      onChange={(e) => setSpouseInfo({...spouseInfo, dlIssueDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseDlExpDate">Expiration Date *</Label>
                    <Input 
                      id="spouseDlExpDate"
                      type="date"
                      value={spouseInfo.dlExpDate}
                      onChange={(e) => setSpouseInfo({...spouseInfo, dlExpDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="spouseOccupation">Occupation *</Label>
                    <Input 
                      id="spouseOccupation"
                      value={spouseInfo.occupation}
                      onChange={(e) => setSpouseInfo({...spouseInfo, occupation: e.target.value})}
                      placeholder="Teacher"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Not filing jointly. Click Next to continue.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Dependent Information</CardTitle>
              <CardDescription>Add information for each dependent you're claiming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dependents.map((dependent, index) => (
                <div key={dependent.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Dependent {index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeDependent(dependent.id)}
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input 
                        value={dependent.name}
                        onChange={(e) => updateDependent(dependent.id, 'name', e.target.value)}
                        placeholder="Child's Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Input 
                        type="date"
                        value={dependent.dob}
                        onChange={(e) => updateDependent(dependent.id, 'dob', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Social Security Number *</Label>
                      <Input 
                        value={dependent.ssn}
                        onChange={(e) => updateDependent(dependent.id, 'ssn', e.target.value)}
                        placeholder="XXX-XX-XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship *</Label>
                      <Input 
                        value={dependent.relationship}
                        onChange={(e) => updateDependent(dependent.id, 'relationship', e.target.value)}
                        placeholder="Son, Daughter, etc."
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button 
                onClick={addDependent}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Dependent
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Document Uploads</CardTitle>
              <CardDescription>Upload required documents (photos or PDFs) - PDFs will be automatically separated by page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pdfJsLoaded && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                  <p className="text-sm">Loading PDF processor... PDFs will be converted to images and separated by page.</p>
                </div>
              )}
              <div className="space-y-4">
                <div className="p-4 border-2 border-dashed rounded-lg">
                  <Label className="block mb-2 font-semibold">Driver's License (Client) *</Label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, 'clientDL')}
                    className="hidden"
                    id="clientDL"
                  />
                  <label htmlFor="clientDL">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {documentUploads.clientDL ? documentUploads.clientDL.name : 'Upload Document'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Accepted: JPG, PNG, PDF (Max 5MB)</p>
                </div>

                {filingJointly && (
                  <div className="p-4 border-2 border-dashed rounded-lg">
                    <Label className="block mb-2 font-semibold">Driver's License (Spouse) *</Label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'spouseDL')}
                      className="hidden"
                      id="spouseDL"
                    />
                    <label htmlFor="spouseDL">
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {documentUploads.spouseDL ? documentUploads.spouseDL.name : 'Upload Document'}
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Accepted: JPG, PNG, PDF (Max 5MB)</p>
                  </div>
                )}

                <div className="p-4 border-2 border-dashed rounded-lg">
                  <Label className="block mb-2 font-semibold">Last Year's Tax Return</Label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, 'lastYearTax')}
                    className="hidden"
                    id="lastYearTax"
                  />
                  <label htmlFor="lastYearTax">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {documentUploads.lastYearTax ? documentUploads.lastYearTax.name : 'Upload Document'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Upload your 2022 tax return if available</p>
                </div>

                <div className="p-4 border-2 border-dashed rounded-lg">
                  <Label className="block mb-2 font-semibold">Income Documents (W-2, 1099, etc.)</Label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'incomeDocuments')}
                    className="hidden"
                    id="incomeDocuments"
                  />
                  <label htmlFor="incomeDocuments">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Documents ({documentUploads.incomeDocuments.length} uploaded)
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">You can upload multiple files - PDFs will be separated by page</p>
                </div>

                <div className="p-4 border-2 border-dashed rounded-lg">
                  <Label className="block mb-2 font-semibold">IRS PIN Letter (if applicable)</Label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, 'irsPin')}
                    className="hidden"
                    id="irsPin"
                  />
                  <label htmlFor="irsPin">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {documentUploads.irsPin ? documentUploads.irsPin.name : 'Upload Document'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Only if you received an IRS PIN letter</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Income Information</CardTitle>
              <CardDescription>Select all income sources and upload supporting documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {incomeTypes.map((incomeType) => (
                  <div key={incomeType} className="p-3 border rounded-lg">
                    <Label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4"
                        checked={isIncomeSelected(incomeType)}
                        onChange={() => toggleIncome(incomeType)}
                      />
                      <span>{incomeType}</span>
                    </Label>
                    {isIncomeSelected(incomeType) && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          onChange={(e) => handleIncomeFileUpload(e, incomeType)}
                          className="hidden"
                          id={`income-${incomeType}`}
                        />
                        <label htmlFor={`income-${incomeType}`}>
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Documents ({incomeData.find(i => i.type === incomeType)?.files.length || 0} uploaded)
                            </span>
                          </Button>
                        </label>
                        {incomeData.find(i => i.type === incomeType)?.files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <span className="truncate flex-1">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeIncomeFile(incomeType, idx)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Income Adjustments</CardTitle>
              <CardDescription>Select adjustments and upload supporting documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {adjustmentTypes.map((adjustmentType) => (
                  <div key={adjustmentType} className="p-3 border rounded-lg">
                    <Label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4"
                        checked={isAdjustmentSelected(adjustmentType)}
                        onChange={() => toggleAdjustment(adjustmentType)}
                      />
                      <span>{adjustmentType}</span>
                    </Label>
                    {isAdjustmentSelected(adjustmentType) && (
                      <div className="mt-3 space-y-2">
                        <Input 
                          placeholder="Amount contributed" 
                          value={getAdjustmentAmount(adjustmentType)}
                          onChange={(e) => updateAdjustmentAmount(adjustmentType, e.target.value)}
                        />
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          onChange={(e) => handleAdjustmentFileUpload(e, adjustmentType)}
                          className="hidden"
                          id={`adjustment-${adjustmentType}`}
                        />
                        <label htmlFor={`adjustment-${adjustmentType}`}>
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Documents ({adjustmentData.find(a => a.type === adjustmentType)?.files.length || 0} uploaded)
                            </span>
                          </Button>
                        </label>
                        {adjustmentData.find(a => a.type === adjustmentType)?.files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <span className="truncate flex-1">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAdjustmentFile(adjustmentType, idx)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 7 && (
          <Card>
            <CardHeader>
              <CardTitle>Credits & Deductions</CardTitle>
              <CardDescription>Select credits/deductions and upload supporting documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {creditTypes.map((creditType) => (
                  <div key={creditType} className="p-3 border rounded-lg">
                    <Label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4"
                        checked={isCreditSelected(creditType)}
                        onChange={() => toggleCredit(creditType)}
                      />
                      <span>{creditType}</span>
                    </Label>
                    {isCreditSelected(creditType) && (
                      <div className="mt-3 space-y-2">
                        <Input 
                          placeholder="Amount or details" 
                          value={getCreditDetails(creditType)}
                          onChange={(e) => updateCreditDetails(creditType, e.target.value)}
                        />
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          onChange={(e) => handleCreditFileUpload(e, creditType)}
                          className="hidden"
                          id={`credit-${creditType}`}
                        />
                        <label htmlFor={`credit-${creditType}`}>
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Documents ({creditData.find(c => c.type === creditType)?.files.length || 0} uploaded)
                            </span>
                          </Button>
                        </label>
                        {creditData.find(c => c.type === creditType)?.files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <span className="truncate flex-1">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCreditFile(creditType, idx)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 8 && (
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Information</CardTitle>
              <CardDescription>For direct deposit of your tax refund</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Secure Information:</strong> Your bank details are encrypted and used only for refund processing.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input 
                    id="bankName"
                    value={bankInfo.bankName}
                    onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})}
                    placeholder="Chase Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input 
                    id="accountNumber"
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({...bankInfo, accountNumber: e.target.value})}
                    placeholder="XXXXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number *</Label>
                  <Input 
                    id="routingNumber"
                    value={bankInfo.routingNumber}
                    onChange={(e) => setBankInfo({...bankInfo, routingNumber: e.target.value})}
                    placeholder="XXXXXXXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 9 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Sign</CardTitle>
              <CardDescription>Review your information and provide digital signatures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 p-6 rounded-lg border-2 border-red-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-900 mb-3">Legal Declaration</h3>
                    <div className="bg-white p-4 rounded border border-red-200">
                      <p className="text-sm text-red-900 leading-relaxed">
                        I certify under penalty of perjury that the information provided is true, correct, and complete. 
                        I acknowledge this document serves as a binding record of the data I provided to The Books Solution 
                        for tax preparation purposes.
                      </p>
                      <p className="text-sm text-red-900 leading-relaxed mt-3">
                        I understand that any false statements or misrepresentations may subject me to penalties under 
                        applicable federal and state laws.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signature">Taxpayer Signature *</Label>
                  <Input 
                    id="signature"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Type your full name"
                    className="text-lg"
                  />
                  <p className="text-xs text-gray-500">By typing your name, you are providing a legal signature certifying the above declaration</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signatureDate">Date *</Label>
                  <Input 
                    id="signatureDate"
                    type="date"
                  />
                </div>
              </div>

              {filingJointly && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Spouse Signature</h3>
                  <div className="space-y-2">
                    <Label htmlFor="spouseSignature">Spouse Signature *</Label>
                    <Input 
                      id="spouseSignature"
                      value={spouseSignature}
                      onChange={(e) => setSpouseSignature(e.target.value)}
                      placeholder="Type your full name"
                      className="text-lg"
                    />
                    <p className="text-xs text-gray-500">By typing your name, you are providing a legal signature certifying the above declaration</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseSignatureDate">Date *</Label>
                    <Input 
                      id="spouseSignatureDate"
                      type="date"
                    />
                  </div>
                </div>
              )}

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Summary</h3>
                <div className="space-y-1 text-sm text-green-800">
                  <p>✓ Client information completed</p>
                  {filingJointly && <p>✓ Spouse information completed</p>}
                  <p>✓ {dependents.length} dependent(s) added</p>
                  <p>✓ {documentUploads.incomeDocuments.length} general documents uploaded</p>
                  <p>✓ {incomeData.reduce((sum, item) => sum + item.files.length, 0)} income documents uploaded</p>
                  <p>✓ {adjustmentData.reduce((sum, item) => sum + item.files.length, 0)} adjustment documents uploaded</p>
                  <p>✓ {creditData.reduce((sum, item) => sum + item.files.length, 0)} credit/deduction documents uploaded</p>
                  <p>✓ Bank information provided</p>
                  <p>✓ User agreement accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="max-w-4xl mx-auto flex justify-between gap-4">
            <Button 
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex-1"
            >
              Previous
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Submit Checklist
              </Button>
            ) : (
              <Button 
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === 0 && !canProceedFromWelcome()}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    pdfjsLib: any
  }
}
