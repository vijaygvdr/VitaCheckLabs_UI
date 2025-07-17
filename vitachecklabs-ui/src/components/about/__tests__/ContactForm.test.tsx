import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ContactForm from '../ContactForm';
import { companyService } from '../../../services/companyService';

const theme = createTheme();

// Mock the companyService
jest.mock('../../../services/companyService', () => ({
  companyService: {
    submitContactForm: jest.fn()
  }
}));

const mockSubmitContactForm = companyService.submitContactForm as jest.MockedFunction<typeof companyService.submitContactForm>;

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ContactForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders contact form with all fields', () => {
    renderWithTheme(<ContactForm />);
    
    expect(screen.getByText('Get In Touch')).toBeInTheDocument();
    expect(screen.getByText('Have questions or need assistance? We\'re here to help!')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Send us a Message')).toBeInTheDocument();
    
    // Check form fields
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Inquiry Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    
    // Check submit button
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });

  test('displays contact information correctly', () => {
    renderWithTheme(<ContactForm />);
    
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('info@vitachecklabs.com')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('123 Healthcare Ave')).toBeInTheDocument();
    expect(screen.getByText('Medical City, HC 12345')).toBeInTheDocument();
  });

  test('form validation - submit button disabled when required fields are empty', () => {
    renderWithTheme(<ContactForm />);
    
    const submitButton = screen.getByText('Send Message');
    expect(submitButton).toBeDisabled();
  });

  test('form validation - submit button enabled when all required fields are filled', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ContactForm />);
    
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'Test message');
    
    const submitButton = screen.getByText('Send Message');
    expect(submitButton).toBeEnabled();
  });

  test('successful form submission', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        message_id: '123',
        status: 'sent',
        estimated_response_time: '24 hours'
      }
    };
    
    mockSubmitContactForm.mockResolvedValueOnce(mockResponse);
    
    renderWithTheme(<ContactForm />);
    
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Phone Number'), '555-123-4567');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'Test message');
    
    await user.click(screen.getByText('Send Message'));
    
    await waitFor(() => {
      expect(mockSubmitContactForm).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        inquiry_type: 'general',
        subject: 'Test Subject',
        message: 'Test message'
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Thank you for your message!/)).toBeInTheDocument();
      expect(screen.getByText(/will respond within 24 hours/)).toBeInTheDocument();
    });
  });

  test('form submission error handling', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to send message';
    
    mockSubmitContactForm.mockRejectedValueOnce(new Error(errorMessage));
    
    renderWithTheme(<ContactForm />);
    
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'Test message');
    
    await user.click(screen.getByText('Send Message'));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('inquiry type selection', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ContactForm />);
    
    const inquiryTypeField = screen.getByLabelText('Inquiry Type');
    await user.click(inquiryTypeField);
    
    await waitFor(() => {
      expect(screen.getByText('General Inquiry')).toBeInTheDocument();
      expect(screen.getByText('Appointment Booking')).toBeInTheDocument();
      expect(screen.getByText('Test Results')).toBeInTheDocument();
      expect(screen.getByText('Billing Question')).toBeInTheDocument();
      expect(screen.getByText('Technical Support')).toBeInTheDocument();
      expect(screen.getByText('Complaint/Feedback')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Appointment Booking'));
    
    await waitFor(() => {
      expect(inquiryTypeField).toHaveValue('appointment');
    });
  });

  test('form resets after successful submission', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        message_id: '123',
        status: 'sent',
        estimated_response_time: '24 hours'
      }
    };
    
    mockSubmitContactForm.mockResolvedValueOnce(mockResponse);
    
    renderWithTheme(<ContactForm />);
    
    const nameField = screen.getByLabelText('Full Name');
    const emailField = screen.getByLabelText('Email');
    const subjectField = screen.getByLabelText('Subject');
    const messageField = screen.getByLabelText('Message');
    
    await user.type(nameField, 'John Doe');
    await user.type(emailField, 'john@example.com');
    await user.type(subjectField, 'Test Subject');
    await user.type(messageField, 'Test message');
    
    await user.click(screen.getByText('Send Message'));
    
    await waitFor(() => {
      expect(nameField).toHaveValue('');
      expect(emailField).toHaveValue('');
      expect(subjectField).toHaveValue('');
      expect(messageField).toHaveValue('');
    });
  });

  test('loading state during form submission', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockSubmitContactForm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithTheme(<ContactForm />);
    
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Test Subject');
    await user.type(screen.getByLabelText('Message'), 'Test message');
    
    await user.click(screen.getByText('Send Message'));
    
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(screen.getByText('Sending...')).toBeDisabled();
  });

  test('email validation', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ContactForm />);
    
    const emailField = screen.getByLabelText('Email');
    await user.type(emailField, 'invalid-email');
    
    // The email field should have type="email" which provides basic validation
    expect(emailField).toHaveAttribute('type', 'email');
  });
});