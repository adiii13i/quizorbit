package com.quizorbit.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;

@Service
public class FileParserService {

    public String extractText(MultipartFile file) throws Exception {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename() != null
                ? file.getOriginalFilename().toLowerCase() : "";

        if ((contentType != null &&
                contentType.equals("application/pdf"))
                || filename.endsWith(".pdf")) {
            return extractFromPdf(file);
        } else if (filename.endsWith(".docx")) {
            return extractFromDocx(file);
        } else if (filename.endsWith(".pptx")) {
            return extractFromPptx(file);
        } else if (contentType != null &&
                contentType.startsWith("image/")) {
            return "IMAGE_FILE:" + filename;
        } else {
            throw new RuntimeException(
                    "Unsupported file type: " + contentType);
        }
    }

    private String extractFromPdf(MultipartFile file) throws Exception {
        byte[] bytes = file.getBytes();
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            return truncateText(text, 8000);
        }
    }

    private String extractFromDocx(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             XWPFDocument document = new XWPFDocument(is)) {
            StringBuilder sb = new StringBuilder();
            for (XWPFParagraph para : document.getParagraphs()) {
                sb.append(para.getText()).append("\n");
            }
            return truncateText(sb.toString(), 8000);
        }
    }

    private String extractFromPptx(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             XMLSlideShow ppt = new XMLSlideShow(is)) {
            StringBuilder sb = new StringBuilder();
            for (XSLFSlide slide : ppt.getSlides()) {
                for (XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof XSLFTextShape) {
                        sb.append(
                            ((XSLFTextShape) shape).getText()
                        ).append("\n");
                    }
                }
            }
            return truncateText(sb.toString(), 8000);
        }
    }

    private String truncateText(String text, int maxChars) {
        if (text.length() > maxChars) {
            return text.substring(0, maxChars) + "...";
        }
        return text;
    }
}