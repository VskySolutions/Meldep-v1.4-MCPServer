// @ts-nocheck
import sanitizeHtml from 'sanitize-html';
import { decode } from 'html-entities';
export function cleanHtml(html) {
    // First, strip all HTML tags and attributes.
    const strippedHtml = sanitizeHtml(html, {
        allowedTags: [], // No tags allowed
        allowedAttributes: {},
    });
    // Then, decode HTML entities.
    const decodedText = decode(strippedHtml);
    // Clean up extra whitespace and newlines for readability.
    // This will collapse multiple newlines/spaces into single ones, and trim.
    return decodedText.replace(/\s+/g, ' ').trim();
}
