const fs = require('fs');
let content = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const oldHandleCopyCode = \  const handleCopyCode = async (code: string) => {
    const text = getInviteMessage(code);

    const markShared = async () => {
      setCopiedCode(code);
      const target = codes.find(c => c.code === code);
      if (target && !target.is_shared) {
        try {
          await markInviteCodeAsShared(target.id);
          setCodes(prev => prev.map(c => c.id === target.id ? { ...c, is_shared: true } : c));
        } catch (e) {
          console.error('Failed to save shared status to DB', e);
        }
      }
      setTimeout(() => setCopiedCode(null), 2000);
    };

    // Try Web Share API first (Best for mobile and some desktops)
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
        await markShared();
        return;
      } catch (e) {
        console.log('Share API failed/cancelled, falling back to clipboard');
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
          await markShared();
          return;
        } catch (writeError) {
          console.warn('Failed to write ClipboardItem, falling back to text only', writeError);
        }
      }

      await navigator.clipboard.writeText(text);
      await markShared();
    } catch (e) {
      onNotify('Error', 'Failed to copy to clipboard.');
    }
  };\;

const newActions = \  const markShared = async (code: string) => {
    setCopiedCode(code);
    const target = codes.find(c => c.code === code);
    if (target && !target.is_shared) {
      try {
        await markInviteCodeAsShared(target.id);
        setCodes(prev => prev.map(c => c.id === target.id ? { ...c, is_shared: true } : c));
      } catch (e) {
        console.error('Failed to save shared status to DB', e);
      }
    }
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShare = async (code: string) => {
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
      await navigator.clipboard.writeText(text);
      await markShared(code);
      onNotify('Copied', 'Message text copied to clipboard!');
    } catch (e) {
      onNotify('Error', 'Failed to copy text.');
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

content = content.replace(oldHandleCopyCode, newActions);

const oldButtons = \                                    <button
                                      onClick={() => handleCopyCode(c.code)}
                                      className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors"
                                      title="Copy Code"
                                    >
                                      {copiedCode === c.code ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                                    </button>\;

const newButtons = \                                    <button
                                      onClick={() => handleShare(c.code)}
                                      className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors"
                                      title="Share (Image + Text)"
                                    >
                                      {copiedCode === c.code ? <Check className="w-5 h-5 text-emerald-600" /> : <Share className="w-5 h-5" />}
                                    </button>
                                    <button
                                      onClick={() => handleCopyText(c.code)}
                                      className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors"
                                      title="Copy Message Text"
                                    >
                                      <Copy className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={handleDownloadIV}
                                      className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors"
                                      title="Download IV Image"
                                    >
                                      <Download className="w-5 h-5" />
                                    </button>\;

content = content.replace(oldButtons, newButtons);
fs.writeFileSync('src/components/AdminModal.tsx', content);
