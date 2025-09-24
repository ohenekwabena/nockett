type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyLock = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.8097 9.34464V7.19564C16.7797 4.67664 14.7097 2.66064 12.1897 2.69164C9.7297 2.72264 7.7297 4.70864 7.6897 7.17564V9.34464" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M12.2498 14.0977V16.3187" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15.8431 20.9967C18.8281 20.3407 19.9101 18.5767 19.9101 15.0367C19.9101 10.3337 18.0001 8.76575 12.2501 8.76575C6.51009 8.76575 4.59009 10.3337 4.59009 15.0367C4.59009 19.7407 6.51009 21.3087 12.2501 21.3087" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}