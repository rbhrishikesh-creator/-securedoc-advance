import docx
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION

doc = docx.Document()

# Section 1: Roman numerals
s1 = doc.sections[0]
s1.footer.is_linked_to_previous = False
p1 = s1.footer.paragraphs[0]
p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
fld1 = parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="PAGE"/>')
p1._p.append(fld1)
pgNumType1 = parse_xml(f'<w:pgNumType {nsdecls("w")} w:fmt="lowerRoman" w:start="1"/>')
s1._sectPr.append(pgNumType1)

doc.add_paragraph('Preliminary Page 1 (i)')
doc.add_page_break()
doc.add_paragraph('Preliminary Page 2 (ii)')

# Section 2: Decimal (Arabic) starting at 1
s2 = doc.add_section(WD_SECTION.NEW_PAGE)
s2.footer.is_linked_to_previous = False
p2 = s2.footer.paragraphs[0]
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
fld2 = parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="PAGE"/>')
p2._p.append(fld2)
pgNumType2 = parse_xml(f'<w:pgNumType {nsdecls("w")} w:fmt="decimal" w:start="1"/>')
s2._sectPr.append(pgNumType2)

doc.add_paragraph('Chapter 1 Page 1')
doc.add_page_break()
doc.add_paragraph('Chapter 1 Page 2')

doc.save('test_pages.docx')
print('Success saving test_pages.docx')
