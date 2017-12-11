const secondsIn = unit => {
    switch (unit) {
    case 'hours':
        return 60 * 60;
    case 'minutes':
        return 60;
    default:
        return 1;
    }
};

export const toSeconds = ({ unit, value }) => secondsIn(unit) * value;
