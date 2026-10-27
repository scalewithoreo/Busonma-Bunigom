const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const oldButtons = \                                  <div className="flex items-center gap-1 sm:gap-2 justify-end">
                                    <button
                                      onClick={() => handleShare(c.code)}
                                      className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors"
                                      title="Share (Image + Text)"
                                    >
                                      {copiedCode === c.code ? <Check className="w-5 h-5 text-emerald-600" /> : <Share className="w-5 h-5" />}
                                    </button>
                                    <button
                                      onClick={() => handleCopyText(c.code)}
                                      className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors"
                                      title="Copy to Clipboard (Image + Text)"
                                    >
                                      <Copy className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={handleDownloadIV}
                                      className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors"
                                      title="Download IV Image"
                                    >
                                      <Download className="w-5 h-5" />
                                    </button>
                                  </div>\;

const newButtons = \                                  <button
                                    onClick={() => handleCopyCode(c.code)}
                                    className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors"
                                    title="Copy Code"
                                  >
                                    {copiedCode === c.code ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                                  </button>\;

content = content.replace(oldButtons, newButtons);

const oldActions = \  const handleShare = async (code: string) => {
    const text = getInviteMessage(code);
    if (navigator.share) {
      try {
        let filesArray: File[] = [];
        try {
          const response = await fetch('/iv.png');
          const blob = await response.blob();
          const file = new File([blob], 'Ore_and_Dara_Invitation.png', { type: blob.type });
          filesArray = [file];
        } catch (fetchErr) {
          console.warn('Could not load IV image for sharing', fetchErr);
        }

        if (navigator.canShare && navigator.canShare({ files: filesArray })) {
          await navigator.share({
            title: 'Ore & Dara Wedding Invitation',
            text: text,
            files: filesArray
          });
        } else {
          await navigator.share({
            title: 'Ore & Dara Wedding Invitation',
            text: text
          });
        }
        await markShared(code);
        return;
      } catch (e) {
        console.log('Share API failed/cancelled');
      }
    } else {
      onNotify('Not Supported', 'Native sharing is not supported on this device. Please use Copy Text and Download IV instead.');
    }
  };

  const handleCopyText = async (code: string) => {
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
  };

  const handleDownloadIV = () => {
    const a = document.createElement('a');
    a.href = '/iv.png';
    a.download = 'Ore_and_Dara_Invitation.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onNotify('Downloading', 'The IV image is being downloaded.');
  };\;

const newAction = \  const handleCopyCode = async (code: string) => {
    const text = getInviteMessage(code);

    if (navigator.share) {
      try {
        let filesArray: File[] = [];
        try {
          const response = await fetch('/iv.png');
          const blob = await response.blob();
          const file = new File([blob], 'Ore_and_Dara_Invitation.png', { type: blob.type });
          filesArray = [file];
        } catch (fetchErr) {
          console.warn('Could not load IV image for sharing', fetchErr);
        }

        if (navigator.canShare && navigator.canShare({ files: filesArray })) {
          await navigator.share({
            title: 'Ore & Dara Wedding Invitation',
            text: text,
            files: filesArray
          });
        } else {
          await navigator.share({
            title: 'Ore & Dara Wedding Invitation',
            text: text
          });
        }
        await markShared(code);
        return;
      } catch (e) {
        console.log('Share API failed/cancelled');
      }
    }

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

content = content.replace(oldActions, newAction);
fs.writeFileSync('src/components/AdminModal.tsx', content);
