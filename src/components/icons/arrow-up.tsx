type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyArrowUpCircle = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.25C6.892 21.25 2.75 17.108 2.75 12C2.75 6.892 6.892 2.75 12 2.75C17.109 2.75 21.25 6.892 21.25 12C21.25 15.6754 19.1061 18.8506 16.0002 20.3426" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15.4712 13.4423L12.0002 9.95631L8.52919 13.4423" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}