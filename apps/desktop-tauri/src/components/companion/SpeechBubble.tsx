export function SpeechBubble({ text }: { text: string }) {
  return (
    <div
      data-testid="local-companion-bubble"
      style={{
        maxWidth: 260,
        padding: '10px 12px',
        borderRadius: 14,
        background: 'rgba(255, 250, 240, 0.96)',
        border: '1px solid rgba(241, 193, 113, 0.82)',
        boxShadow: '0 12px 28px rgba(63, 46, 22, 0.18)',
        color: '#3b2a1a',
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1.45,
      }}
    >
      {text}
    </div>
  );
}
