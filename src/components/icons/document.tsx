type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyDocument = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.8451 15.6971H8.62512" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15.8451 11.9371H8.62512" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M11.3799 8.17712H8.62488" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M20.267 7.848C19.425 4.104 17.066 2.75 12.25 2.75C5.95701 2.75 3.85901 5.063 3.85901 12C3.85901 18.937 5.95701 21.25 12.25 21.25C18.544 21.25 20.641 18.937 20.641 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}