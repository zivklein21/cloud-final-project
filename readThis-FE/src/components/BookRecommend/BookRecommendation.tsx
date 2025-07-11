import React, { useEffect, useState } from "react";
import { fetchBookRecommendations } from "../../Utils/books_service";
import style from "./Books.module.css";

interface Props {
    bookTitle: string;
    onClose: () => void;
}

const BookRecommendationsPopup: React.FC<Props> = ({ bookTitle,  }) => {
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getRecommendations = async () => {
            const books = await fetchBookRecommendations(bookTitle);
            setRecommendations(books);
            setLoading(false);
        };

        getRecommendations();

        // Timeout if no books are found in 1 minute
        const timeout = setTimeout(() => {
            if (!recommendations.length) setRecommendations(["No similar books found."]);
            setLoading(false);
        }, 60000);

        return () => clearTimeout(timeout);
    }, [bookTitle]);

    return (
        <div className={style.popup}>
            <h2>📚 Recommended Books</h2>
            {loading ? (
                <p>Loading recommendations...</p>
            ) : (
                <ul>
                    {recommendations.map((book, index) => {
                        const match = book.match(/"(.+?)" by (.+)/);
                        if (match) {
                            const title = match[1]; // Extract book title
                            const author = match[2]; // Extract author name
                            return (
                                <li key={index}>
                                    <strong>{title}</strong> — <em>{author}</em>
                                </li>
                            );
                        }
                        return <li key={index}>{book}</li>;
                    })}
                </ul>
            )}
        </div>
    );
};

export default BookRecommendationsPopup;