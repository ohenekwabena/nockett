type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyEditSquare = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.0002 2.75012C5.06324 2.75012 2.75024 5.06312 2.75024 12.0001C2.75024 18.9371 5.06324 21.2501 12.0002 21.2501C18.9372 21.2501 21.2502 18.9371 21.2502 12.0001" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M19.5285 4.30388V4.30388C18.5355 3.42488 17.0185 3.51688 16.1395 4.50988C16.1395 4.50988 11.7705 9.44488 10.2555 11.1579C8.73853 12.8699 9.85053 15.2349 9.85053 15.2349C9.85053 15.2349 12.3545 16.0279 13.8485 14.3399C15.3435 12.6519 19.7345 7.69288 19.7345 7.69288C20.6135 6.69988 20.5205 5.18288 19.5285 4.30388Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15.009 5.80078L18.604 8.98378" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}