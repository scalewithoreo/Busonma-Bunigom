const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const oldCopy = \  const handleCopyText = async (code: string) => {
    const text = getInviteMessage(code);
    try {
      await navigator.clipboard.writeText(text);
      await markShared(code);
      onNotify('Copied', 'Message text copied to clipboard!');
    } catch (e) {
      onNotify('Error', 'Failed to copy text.');
    }
  };\;

const newCopy = \  const handleCopyText = async (code: string) => {
    const text = getInviteMessage(code);
    try {
      let imageBlob: Blob | null = null;
      try {
        const response = await fetch('/iv.png');
        imageBlob = await response.blob();
      } catch (e) {
        console.warn('Could not fetch image for clipboard', e);
      }

      if (imageBlob && navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
        try {
          const clipboardItem = new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            [imageBlob.type]: imageBlob
          });
          await navigator.clipboard.write([clipboardItem]);
          await markShared(code);
          onNotify('Copied', 'Image and text copied to clipboard!');
          return;
        } catch (writeError) {
          console.warn('Failed to write ClipboardItem, falling back to text only', writeError);
        }
      }

      await navigator.clipboard.writeText(text);
      await markShared(code);
      onNotify('Copied', 'Text copied to clipboard!');
    } catch (e) {
      onNotify('Error', 'Failed to copy to clipboard.');
    }
  };\;

content = content.replace(oldCopy, newCopy);
fs.writeFileSync('src/components/AdminModal.tsx', content);
