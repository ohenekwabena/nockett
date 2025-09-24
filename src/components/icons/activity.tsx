type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyActivity = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.24463 14.7815L10.2378 10.8913L13.652 13.5732L16.581 9.79291" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <circle cx="19.9954" cy="4.20024" r="1.9222" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
            <path d="M14.9243 3.12015H7.65655C4.64511 3.12015 2.77783 5.25287 2.77783 8.26431V16.3467C2.77783 19.3581 4.6085 21.4817 7.65655 21.4817H8.49976" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M21.1393 9.3078V16.3467C21.1393 19.3581 19.272 21.4817 16.2606 21.4817H11.9585" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}