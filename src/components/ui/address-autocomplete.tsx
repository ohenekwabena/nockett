'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    useJsApiLoader
} from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const libraries = ['places', 'maps'];

interface AddressAutocompleteProps {
    onAddressSelect: (address: {
        fullAddress: string;
        city: string;
        state: string;
        zipCode: string;
    }) => void;
    onInputChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    value?: string;
    required?: boolean;
    disabled?: boolean;
}

export function AddressAutocomplete({
    onAddressSelect,
    onInputChange,
    placeholder = "Enter property address",
    className,
    value,
    required = false,
    disabled = false
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value || '');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);
    const [errorState, setErrorState] = useState<string | null>(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        libraries: libraries as any,
    });

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (!isLoaded || !mounted || !inputRef.current) return;

        const input = inputRef.current;
        let listener: google.maps.MapsEventListener | null = null;

        try {
            // Verify that the Places API is properly loaded
            if (!google.maps.places || !google.maps.places.Autocomplete) {
                throw new Error('Google Maps Places API not available');
            }

            console.log('Google Maps Places API loaded successfully - billing is enabled');

            const autocomplete = new google.maps.places.Autocomplete(input, {
                types: ['address'],
                componentRestrictions: { country: 'us' },
                fields: ['address_components', 'formatted_address'],
            });

            listener = autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();

                if (place && place.address_components) {
                    let streetNumber = '';
                    let route = '';
                    let city = '';
                    let state = '';
                    let zipCode = '';

                    for (const component of place.address_components) {
                        const types = component.types;

                        if (types.includes('street_number')) {
                            streetNumber = component.long_name;
                        } else if (types.includes('route')) {
                            route = component.long_name;
                        } else if (types.includes('locality')) {
                            city = component.long_name;
                        } else if (types.includes('administrative_area_level_1')) {
                            state = component.short_name;
                        } else if (types.includes('postal_code')) {
                            zipCode = component.long_name;
                        }
                    }

                    const fullAddress = place.formatted_address?.split(',')[0] || `${streetNumber} ${route}`.trim();
                    setInputValue(fullAddress);

                    onAddressSelect({
                        fullAddress,
                        city,
                        state,
                        zipCode
                    });
                }
            });

            setErrorState(null);

        } catch (error) {
            console.error('Google Maps API Error:', error);

            // Check for billing error
            if ((error as Error).message?.includes('BillingNotEnabledMapError') ||
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any)?.code === 'BillingNotEnabledMapError') {

                const billingError =
                    'Google Maps API requires billing to be enabled. ' +
                    'Please enable billing at https://console.cloud.google.com/project/_/billing/enable';

                console.warn(billingError);
                setErrorState(billingError);
            } else {
                setErrorState('Could not initialize address autocomplete');
            }
        }

        // Cleanup function
        return () => {
            if (listener) {
                google.maps.event.removeListener(listener);
            }
        };
    }, [isLoaded, mounted, onAddressSelect]);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        // Notify parent component that the user is typing
        if (onInputChange) {
            onInputChange(value);
        }
    };

    // If API is not loaded or there's an error, show a basic input with optional error message
    if (!isLoaded || errorState) {
        return (
            <div className="relative">
                <Input
                    type="text"
                    placeholder={errorState ? "Manual address entry (autocomplete unavailable)" : placeholder}
                    className={cn("w-full", className)}
                    value={inputValue}
                    onChange={handleInputChange}
                    required={required}
                    disabled={disabled}
                />
                {errorState && (
                    <div className="mt-1 text-xs text-red-500">
                        {errorState}
                    </div>
                )}
            </div>
        );
    }

    // Standard case with autocomplete
    return (
        <div className="relative">
            <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                className={cn("w-full", className)}
                value={inputValue}
                onChange={handleInputChange}
                required={required}
                disabled={disabled}
            />
            <div ref={containerRef} className="absolute top-0 left-0 w-full"></div>
        </div>
    );
}

export default AddressAutocomplete;
