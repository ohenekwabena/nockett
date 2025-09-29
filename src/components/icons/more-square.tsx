type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyMoreSquare = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.25 21.7847C5.313 21.7847 3 19.4717 3 12.5347C3 5.59767 5.313 3.28467 12.25 3.28467C19.187 3.28467 21.5 5.59767 21.5 12.5347C21.5 18.0407 20.043 20.6337 15.974 21.4687" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M16.244 12.5345H16.253" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M12.245 12.5345H12.254" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M8.24501 12.5345H8.25401" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}