type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyArrowDownSquare = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.25 16.0858V7.91382" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M16 12.3215C16 12.3215 13.47 16.0855 12.25 16.0855C11.03 16.0855 8.5 12.3215 8.5 12.3215" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15.594 21.006C19.955 20.255 21.5 17.674 21.5 12C21.5 5.063 19.19 2.75 12.25 2.75C5.31 2.75 3 5.063 3 12C3 18.937 5.31 21.25 12.25 21.25" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}