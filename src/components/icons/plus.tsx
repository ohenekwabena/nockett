type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyPlus = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.25 8.96021V16.1082" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15.8279 12.5344H8.67188" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M12.2499 2.79761C19.5519 2.79761 21.9869 5.23261 21.9869 12.5346C21.9869 19.8366 19.5519 22.2716 12.2499 22.2716C4.94794 22.2716 2.51294 19.8366 2.51294 12.5346C2.51294 6.56461 4.14094 3.84761 8.72494 3.05561" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}