# OneDrive Folder Structure
# Path: C:\Users\rythe\OneDrive\NIIT NF

This document describes the folder structure that will be created in OneDrive.
The backend will automatically create these folders when you initialize the folder structure.

## Main Folder Structure:

```
C:\Users\rythe\OneDrive\NIIT NF\
│
├── Direct Tax\
│   ├── Income Tax\
│   ├── TDS Returns\
│   ├── Income Tax Returns\
│   ├── Income Tax Assessments\
│   └── Power of Attorney\
│
├── Indirect Tax - GST\
│
├── Co'Law\
│   ├── ROC Compliances\
│   ├── Board Resolution Copy\
│   └── Minute Books\
│
├── RBI\
│   ├── Annual Compliances\
│   ├── Financials\
│   └── Returns\
│
├── SEBI Compliances\
│
├── Statutory Docs\
│
├── Balance Sheet\
│   ├── Directors Report\
│   ├── Financial Statement / SOA\
│   └── Audit / Tax Audit Report\
│
├── Admin\
│   ├── Agreements\
│   ├── Demat Holding and CML\
│   ├── GIFT\
│   ├── Insurance payment\
│   ├── Lease Data\
│   ├── Loan given and/or taken\
│   ├── PPF Payment\
│   ├── PPF Statement\
│   └── Rent Receipt\
│
├── Finance\
│   ├── Bank Statements\
│   ├── Banking Details\
│   ├── Credit Card Statements\
│   ├── Credit Rating Agency\
│   ├── Donation\
│   ├── Fixed Deposit\
│   ├── Forex Transactions\
│   └── Moveable Assets Addition / Sale\
│
└── Operations\
    ├── Fixed Assets Addition / Sale\
    ├── MF, PMS, Bond, CG state.\
    ├── Property Documents\
    ├── Related Party Transaction\
    └── Trust Deeds\
```

## How to Initialize:

1. Make sure the path `C:\Users\rythe\OneDrive\NIIT NF` exists or the application has permission to create it

2. Log in as admin to the web application

3. Navigate to "Manage Folders" tab

4. Click "Initialize Default Structure" button

5. The backend will automatically create all folders in OneDrive

## Notes:

- All uploaded files will be stored in these folders with reference numbers
- Files are auto-renamed with format: `NF1000_filename.ext`
- Physical files are synced to OneDrive
- Metadata is stored in MongoDB Atlas
