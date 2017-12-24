export const showTime = totalSeconds => {
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds % (60 * 60) / 60);
    const hours = Math.floor(totalSeconds / (60 * 60));
    let s = '';
    if (hours > 0) {
        const plural = hours > 1 && 's' || '';
        s += `${hours} hour${plural}, `;
    }
    if (minutes > 0) {
        const plural = minutes > 1 && 's' || '';
        s += `${minutes} minute${plural}, `;
    }
    if (seconds > 0) {
        const plural = seconds > 1 && 's' || '';
        s += `${seconds} second${plural}`;
    }
    return s.replace(/, $/, '');
};
