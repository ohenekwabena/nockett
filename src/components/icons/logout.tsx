type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyLogout = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.016 7.3895V6.4565C15.016 4.4215 13.366 2.7715 11.331 2.7715H6.45597C4.42197 2.7715 2.77197 4.4215 2.77197 6.4565V12.0215" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15.016 16.6545V17.5975C15.016 19.6265 13.37 21.2715 11.341 21.2715H6.45597C4.42197 21.2715 2.77197 19.6215 2.77197 17.5865V15.804" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M21.8096 12.0214H9.76855" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M18.8813 9.10629L19.6133 9.83504M21.8093 12.0213L18.8813 14.9373" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}