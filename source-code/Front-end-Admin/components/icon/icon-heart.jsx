const IconHeart = ({ className }) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}>
            <path
                d="M12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round" />
            <path
                opacity="0.5"
                d="M12 5.50063C16.4998 0.825464 22 4.27416 22 9.1371C22 14 17.9806 16.5914 15.0383 18.9109C14 19.7294 13 20.5 12 20.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round" />
        </svg>
    );
};

export default IconHeart;
