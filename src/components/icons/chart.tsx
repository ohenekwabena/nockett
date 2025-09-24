type IconlyIconProps = {
    size?: number;
    color?: string;
}

export const IconlyChart = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
    return (
        <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.69604 10.7588V17.4528" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M12.25 7.5553V17.4533" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M16.729 14.2961V17.4531" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M12.2499 22.2716C4.94794 22.2716 2.51294 19.8366 2.51294 12.5346C2.51294 5.23261 4.94794 2.79761 12.2499 2.79761C19.5519 2.79761 21.9869 5.23261 21.9869 12.5346C21.9869 18.2326 20.5049 20.9666 16.3839 21.8936" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}