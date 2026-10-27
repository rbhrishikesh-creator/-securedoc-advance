import os
import win32com.client

docx_path = os.path.abspath("SecureDoc_Project_Report.docx")
pdf_path = os.path.abspath("SecureDoc_Project_Report.pdf")

print("Opening Word Application...")
word = win32com.client.DispatchEx("Word.Application")
word.Visible = False
word.DisplayAlerts = False

try:
    doc = word.Documents.Open(docx_path)
    
    # Force document layout calculation
    word.ActiveDocument.Repaginate()
    
    # 2 is wdStatisticPages
    page_count = doc.ComputeStatistics(2)
    print(f"WORD_PAGE_COUNT: {page_count}")
    
    # 17 is wdFormatPDF
    doc.SaveAs(pdf_path, FileFormat=17)
    print(f"PDF exported successfully to: {pdf_path}")
    doc.Close(False)
finally:
    word.Quit()
