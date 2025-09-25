type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyInfoSquare = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.277 21.5942C19.878 20.9122 21.5 18.3462 21.5 12.5372C21.5 5.60023 19.187 3.28723 12.25 3.28723C5.313 3.28723 3 5.60023 3 12.5372C3 19.2875 5.19013 21.6593 11.6997 21.7822" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M12.25 16.4324V12.5374" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M12.255 9.03735H12.246" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}