import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Close as CloseIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { getCustomers, createCustomer } from '../api';

const STEPS = ['Upload Excel', 'Preview & Validate', 'Duplicate Check', 'Import', 'Report'];

export const CustomerImportWizard = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState({ success: 0, failed: 0, skipped: 0, errors: [] });
  const fileInputRef = useRef(null);

  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setRows([]);
    setImportSummary({ success: 0, failed: 0, skipped: 0, errors: [] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isProcessing) return; // Prevent closing while processing
    if (activeStep === STEPS.length - 1 && importSummary.success > 0) {
      onSuccess();
    }
    handleReset();
    onClose();
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const parseAndValidate = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const parsedRows = jsonData.map((row, index) => {
        const errors = [];
        
        // Map columns (assuming headers: Name, Email, Phone No., Address, GSTIN, Receivable Balance)
        // Adjust these to match the user's expected exact headers, or normalize keys
        // To handle slight variations, let's normalize keys
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.trim().toLowerCase()] = row[key];
        });

        const name = normalizedRow['name'];
        const email = normalizedRow['email'];
        const phone = normalizedRow['phone no.'] || normalizedRow['phone'];
        const address = normalizedRow['address'];
        const gstin = normalizedRow['gstin'];
        const rawBalance = normalizedRow['receivable balance'] || normalizedRow['opening balance'];
        
        // Validation
        if (!name || String(name).trim() === '') {
          errors.push('Name is required');
        }
        
        let opening_balance = 0.00;
        if (rawBalance !== undefined && rawBalance !== null && rawBalance !== '') {
          const num = Number(rawBalance);
          if (isNaN(num)) {
            errors.push('Receivable Balance must be numeric');
          } else if (num < 0) {
            errors.push('Receivable Balance cannot be negative');
          } else {
            opening_balance = num;
          }
        }

        return {
          originalIndex: index + 2, // +2 for header row and 1-based index
          data: {
            name: name ? String(name).trim() : '',
            email: email ? String(email).trim() : null,
            phone: phone ? String(phone).trim() : null,
            address: address ? String(address).trim() : null,
            gstin: gstin ? String(gstin).trim() : null,
            opening_balance,
            active: true // New column
          },
          status: errors.length > 0 ? 'invalid' : 'pending',
          errors
        };
      });

      setRows(parsedRows);
      setActiveStep(1);
    } catch (err) {
      console.error('Error parsing Excel:', err);
      alert('Failed to parse the Excel file. Please ensure it is a valid .xlsx file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const checkForDuplicates = async () => {
    setIsProcessing(true);
    try {
      // Fetch all existing customers to check for duplicates
      // In a very large DB, we might want to do this in batches or server-side, 
      // but per rules, we use existing API if possible.
      const existingCustomers = await getCustomers();
      
      const updatedRows = rows.map(row => {
        if (row.status === 'invalid') return row; // Keep invalid status
        
        const isDuplicate = existingCustomers.some(
          c => c.name.toLowerCase() === row.data.name.toLowerCase()
        );

        if (isDuplicate) {
          return {
            ...row,
            status: 'duplicate',
            errors: [...row.errors, 'A customer with this name already exists']
          };
        }
        
        return { ...row, status: 'valid' };
      });
      
      setRows(updatedRows);
      setActiveStep(2);
    } catch (err) {
      console.error('Error checking duplicates:', err);
      alert('Failed to check for duplicates.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeImport = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const finalErrors = [];

    const finalRows = [...rows];

    for (let i = 0; i < finalRows.length; i++) {
      const row = finalRows[i];
      if (row.status === 'invalid') {
        failedCount++;
        finalErrors.push(`Row ${row.originalIndex}: Validation failed - ${row.errors.join(', ')}`);
        continue;
      }
      if (row.status === 'duplicate') {
        skippedCount++;
        finalErrors.push(`Row ${row.originalIndex}: Skipped duplicate - ${row.data.name}`);
        continue;
      }
      
      if (row.status === 'valid') {
        try {
          await createCustomer(row.data);
          finalRows[i].status = 'imported';
          successCount++;
        } catch (err) {
          finalRows[i].status = 'error';
          finalRows[i].errors.push(err.message);
          failedCount++;
          finalErrors.push(`Row ${row.originalIndex}: Import failed - ${err.message}`);
        }
      }
    }

    setRows(finalRows);
    setImportSummary({ success: successCount, failed: failedCount, skipped: skippedCount, errors: finalErrors });
    setActiveStep(3); // Move to Report
    setIsProcessing(false);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <input
              type="file"
              accept=".xlsx"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 2 }}
            >
              Select Excel File (.xlsx)
            </Button>
            {file && (
              <Typography variant="body2" color="text.secondary">
                Selected: {file.name}
              </Typography>
            )}
            <Box sx={{ mt: 4, textAlign: 'left', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Required Columns:</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>- Name</Typography>
              <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>Optional Columns:</Typography>
              <Typography variant="body2" color="text.secondary">
                - Email<br/>
                - Phone No.<br/>
                - Address<br/>
                - GSTIN<br/>
                - Receivable Balance
              </Typography>
            </Box>
          </Box>
        );
      
      case 1:
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">
                {rows.length} rows found
              </Typography>
              <Box>
                <Chip label={`${rows.filter(r => r.status === 'valid' || r.status === 'pending').length} Valid`} color="success" size="small" sx={{ mr: 1 }} />
                {activeStep === 2 && <Chip label={`${rows.filter(r => r.status === 'duplicate').length} Duplicates`} color="warning" size="small" sx={{ mr: 1 }} />}
                <Chip label={`${rows.filter(r => r.status === 'invalid').length} Invalid`} color="error" size="small" />
              </Box>
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Issues</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx} sx={{ bgcolor: row.status === 'invalid' ? 'error.50' : row.status === 'duplicate' ? 'warning.50' : 'inherit' }}>
                      <TableCell>{row.originalIndex}</TableCell>
                      <TableCell>
                        {row.status === 'invalid' && <Chip label="Invalid" color="error" size="small" />}
                        {row.status === 'duplicate' && <Chip label="Duplicate" color="warning" size="small" />}
                        {row.status === 'valid' && <Chip label="Valid" color="success" size="small" />}
                        {row.status === 'pending' && <Chip label="Pending" color="default" size="small" />}
                      </TableCell>
                      <TableCell>{row.data.name}</TableCell>
                      <TableCell>{row.data.email}</TableCell>
                      <TableCell>{row.data.phone}</TableCell>
                      <TableCell>{row.data.opening_balance}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="error">
                          {row.errors.join(', ')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ py: 4 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Successfully imported {importSummary.success} customers.
            </Alert>
            {importSummary.skipped > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Skipped {importSummary.skipped} duplicate records.
              </Alert>
            )}
            {importSummary.failed > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to import {importSummary.failed} records.
              </Alert>
            )}
            
            {importSummary.errors.length > 0 && (
              <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Log:</Typography>
                {importSummary.errors.map((err, i) => (
                  <Typography key={i} variant="caption" display="block" color="text.secondary">
                    {err}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Import Customers
        <IconButton onClick={handleClose} disabled={isProcessing} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stepper activeStep={activeStep === 3 ? 4 : activeStep} sx={{ mb: 4 }} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        {activeStep === 0 && (
          <Button 
            variant="contained" 
            onClick={parseAndValidate} 
            disabled={!file || isProcessing}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Parse & Validate'}
          </Button>
        )}
        
        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)} disabled={isProcessing}>Back</Button>
            <Button 
              variant="contained" 
              onClick={checkForDuplicates} 
              disabled={isProcessing}
            >
              {isProcessing ? <CircularProgress size={24} /> : 'Check Duplicates'}
            </Button>
          </>
        )}

        {activeStep === 2 && (
          <>
            <Button onClick={() => setActiveStep(1)} disabled={isProcessing}>Back</Button>
            <Button 
              variant="contained" 
              onClick={executeImport} 
              disabled={isProcessing || rows.filter(r => r.status === 'valid').length === 0}
            >
              {isProcessing ? <CircularProgress size={24} /> : 'Import Valid Rows'}
            </Button>
          </>
        )}

        {activeStep === 3 && (
          <Button variant="contained" onClick={handleClose}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
