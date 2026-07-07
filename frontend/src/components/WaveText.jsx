function WaveText({ text, className = '', as: Tag = 'span' }) {
  return (
    <Tag className={`wave-text ${className}`}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="wave-letter"
          style={{ animationDelay: `${i * 0.025}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Tag>
  )
}

export default WaveText